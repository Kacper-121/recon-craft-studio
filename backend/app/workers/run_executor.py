import asyncio
import shlex
import traceback
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.run import RunStatus, StepStatus, Finding, FindingSeverity
from app.models.workflow import NodeKind
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

async def execute_run_async(run_id: str, workflow_doc: dict, targets: list, run_mode: str):
    """Execute a workflow run asynchronously."""
    try:
        # Mongo connection
        client = AsyncIOMotorClient(settings.MONGO_URI)
        db = client[settings.MONGO_DB_NAME]
        runs = db.runs

        # Set run to running
        await runs.update_one({"id": run_id}, {"$set": {"status": RunStatus.RUNNING, "startedAt": datetime.utcnow()}})

        for node in workflow_doc.get("nodes", []):
            node_id = node["id"]
            node_kind = node.get("kind")

            await _update_step_status(runs, run_id, node_id, StepStatus.RUNNING)
            try:
                if node_kind == NodeKind.NMAP:
                    await _run_nmap_step(runs, run_id, node, targets)
                else:
                    await _append_step_log(runs, run_id, node_id, f"Skipping unsupported node type: {node_kind}")
                    await _update_step_status(runs, run_id, node_id, StepStatus.SUCCEEDED)
            except Exception as e:
                tb = traceback.format_exc()
                await _append_step_log(runs, run_id, node_id, f"Error running node: {e}\n{tb}")
                await _update_step_status(runs, run_id, node_id, StepStatus.FAILED, str(e))
                await runs.update_one({"id": run_id}, {"$set": {"status": RunStatus.FAILED, "endedAt": datetime.utcnow()}})
                return

        # Mark run completed
        await runs.update_one({"id": run_id}, {"$set": {"status": RunStatus.SUCCEEDED, "endedAt": datetime.utcnow()}})
        logger.info("Run completed successfully", run_id=run_id)

    except Exception as e:
        logger.error("Fatal error executing run", run_id=run_id, error=str(e))
        tb = traceback.format_exc()
        await runs.update_one({"id": run_id}, {"$set": {"status": RunStatus.FAILED, "error": tb, "endedAt": datetime.utcnow()}})
    finally:
        client.close()

async def _run_nmap_step(runs, run_id: str, node: dict, targets: list):
    """Execute an Nmap scan node."""
    node_id = node["id"]
    config = node.get("config", {})
    args = config.get("args", "-sV -Pn")
    ports = config.get("ports")

    base_cmd = ["nmap"]
    if args:
        base_cmd += shlex.split(args)
    if ports:
        base_cmd += ["-p", str(ports)]

    results = []
    for target in targets:
        cmd = base_cmd + [target]
        await _append_step_log(runs, run_id, node_id, f"Running command: {' '.join(cmd)}")

        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        out_text = stdout.decode("utf-8", errors="replace")
        err_text = stderr.decode("utf-8", errors="replace")

        if out_text:
            await _append_step_log(runs, run_id, node_id, f"[{target}] Nmap output:\n{out_text}")
        if err_text:
            await _append_step_log(runs, run_id, node_id, f"[{target}] Nmap errors:\n{err_text}")

        # Example of simple finding detection
        findings = []
        if "open" in out_text.lower():
            findings.append(Finding(
                id=f"{node_id}-{target}-open",
                severity=FindingSeverity.MEDIUM,
                title=f"Open ports found on {target}",
                description="One or more open ports detected.",
                service="nmap",
                metadata={"output": out_text}
            ).dict())

        await runs.update_one(
            {"id": run_id, "steps.nodeId": node_id},
            {"$push": {"steps.$.findings": {"$each": findings}}}
        )

        results.append({"target": target, "stdout": out_text, "stderr": err_text})

    await _append_step_log(runs, run_id, node_id, "Nmap scan completed.")
    await _update_step_status(runs, run_id, node_id, StepStatus.SUCCEEDED)

async def _append_step_log(runs, run_id: str, step_id: str, log: str):
    """Push a log line into step logs."""
    await runs.update_one({"id": run_id, "steps.nodeId": step_id}, {"$push": {"steps.$.logs": log}})

async def _update_step_status(runs, run_id: str, step_id: str, status: StepStatus, error: str = None):
    """Update the status for a given step."""
    update = {"steps.$.status": status}
    if status == StepStatus.RUNNING:
        update["steps.$.startedAt"] = datetime.utcnow()
    elif status in [StepStatus.SUCCEEDED, StepStatus.FAILED]:
        update["steps.$.completedAt"] = datetime.utcnow()
    if error:
        update["steps.$.error"] = error
    await runs.update_one({"id": run_id, "steps.nodeId": step_id}, {"$set": update})
