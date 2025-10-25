"""
Worker module for executing workflow runs.
This module is executed by RQ workers to process queued jobs.
"""
import asyncio
from typing import List, Dict, Any
from datetime import datetime
from pymongo import MongoClient
from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.workers.tool_runner import ToolRunner
from app.models.run import RunStatus, StepStatus

setup_logging()
logger = get_logger(__name__)


def execute_run(run_id: str, workflow: Dict[str, Any], targets: List[str], run_mode: str):
    """
    Execute a workflow run.
    This function is called by RQ workers.
    """
    logger.info("Starting run execution", run_id=run_id, run_mode=run_mode)

    # Connect to MongoDB (synchronous for worker)
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    try:
        # Update run status to running
        db.runs.update_one(
            {"id": run_id},
            {"$set": {"status": RunStatus.RUNNING}}
        )

        # Get workflow nodes and edges
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])

        # Build execution graph
        execution_order = build_execution_order(nodes, edges)

        logger.info("Execution order determined", run_id=run_id, steps=len(execution_order))

        # Execute each node in order
        tool_runner = ToolRunner(run_mode=run_mode)

        for node in execution_order:
            node_id = node["id"]
            node_kind = node["kind"]
            node_config = node.get("config", {})

            logger.info("Executing node", run_id=run_id, node_id=node_id, kind=node_kind)

            # Update step status to running
            db.runs.update_one(
                {"id": run_id, "steps.nodeId": node_id},
                {"$set": {
                    "steps.$.status": StepStatus.RUNNING,
                    "steps.$.startedAt": datetime.utcnow()
                }}
            )

            # Add initial log
            log = f"[{datetime.utcnow().isoformat()}] Starting {node['label']}"
            db.runs.update_one(
                {"id": run_id, "steps.nodeId": node_id},
                {"$push": {"steps.$.logs": log}}
            )

            try:
                # Execute the tool
                result = tool_runner.execute(
                    node_kind=node_kind,
                    node_config=node_config,
                    targets=targets,
                    run_id=run_id,
                    node_id=node_id
                )

                # Add logs from execution
                for log_line in result.get("logs", []):
                    db.runs.update_one(
                        {"id": run_id, "steps.nodeId": node_id},
                        {"$push": {"steps.$.logs": log_line}}
                    )

                # Add findings if any
                if result.get("findings"):
                    db.runs.update_one(
                        {"id": run_id, "steps.nodeId": node_id},
                        {"$set": {"steps.$.findings": result["findings"]}}
                    )

                # Update step status to succeeded
                db.runs.update_one(
                    {"id": run_id, "steps.nodeId": node_id},
                    {"$set": {
                        "steps.$.status": StepStatus.SUCCEEDED,
                        "steps.$.completedAt": datetime.utcnow()
                    }}
                )

                logger.info("Node execution completed", run_id=run_id, node_id=node_id)

            except Exception as e:
                error_msg = str(e)
                logger.error("Node execution failed", run_id=run_id, node_id=node_id, error=error_msg)

                # Add error log
                error_log = f"[{datetime.utcnow().isoformat()}] ERROR: {error_msg}"
                db.runs.update_one(
                    {"id": run_id, "steps.nodeId": node_id},
                    {"$push": {"steps.$.logs": error_log}}
                )

                # Update step status to failed
                db.runs.update_one(
                    {"id": run_id, "steps.nodeId": node_id},
                    {"$set": {
                        "steps.$.status": StepStatus.FAILED,
                        "steps.$.completedAt": datetime.utcnow(),
                        "steps.$.error": error_msg
                    }}
                )

                # If critical node fails, fail the entire run
                if node_kind not in ["slackAlert", "discordAlert", "reportExport"]:
                    raise

        # Calculate summary
        summary = calculate_summary(db, run_id)

        # Update run status to succeeded
        db.runs.update_one(
            {"id": run_id},
            {"$set": {
                "status": RunStatus.SUCCEEDED,
                "endedAt": datetime.utcnow(),
                "summary": summary
            }}
        )

        logger.info("Run execution completed successfully", run_id=run_id)

    except Exception as e:
        logger.error("Run execution failed", run_id=run_id, error=str(e))

        # Update run status to failed
        db.runs.update_one(
            {"id": run_id},
            {"$set": {
                "status": RunStatus.FAILED,
                "endedAt": datetime.utcnow(),
                "error": str(e)
            }}
        )

    finally:
        client.close()


def build_execution_order(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    """Build the order in which nodes should be executed based on edges."""
    # Simple topological sort
    # For MVP, we'll execute nodes in the order they appear
    # In production, implement proper topological sort based on edges

    # Filter out non-execution nodes or sort by connections
    execution_order = [node for node in nodes if node["kind"] != "start"]

    return execution_order


def calculate_summary(db, run_id: str) -> Dict[str, Any]:
    """Calculate run summary from findings."""
    run = db.runs.find_one({"id": run_id})

    if not run:
        return {}

    total_findings = 0
    severities = {"low": 0, "medium": 0, "high": 0, "critical": 0}

    for step in run.get("steps", []):
        findings = step.get("findings", [])
        total_findings += len(findings)

        for finding in findings:
            severity = finding.get("severity", "low")
            severities[severity] = severities.get(severity, 0) + 1

    return {
        "findingsCount": total_findings,
        "severities": severities
    }
