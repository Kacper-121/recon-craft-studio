"""
Tool runner module for executing security tools in Docker containers.
"""
import docker
import uuid
import json
from typing import Dict, Any, List
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ToolRunner:
    """Executes security tools in sandboxed Docker containers."""

    def __init__(self, run_mode: str = "live"):
        self.run_mode = run_mode
        self.docker_client = docker.from_env() if run_mode == "live" else None

    def execute(
        self,
        node_kind: str,
        node_config: Dict[str, Any],
        targets: List[str],
        run_id: str,
        node_id: str
    ) -> Dict[str, Any]:
        """Execute a tool based on node kind."""

        if self.run_mode == "demo":
            return self._execute_demo(node_kind, node_config, targets)

        # Map node kinds to execution methods
        executors = {
            "nmap": self._execute_nmap,
            "httpProbe": self._execute_http_probe,
            "parserRules": self._execute_parser,
            "gitleaks": self._execute_gitleaks,
            "slackAlert": self._execute_slack_alert,
            "discordAlert": self._execute_discord_alert,
            "reportExport": self._execute_report_export,
            "delay": self._execute_delay,
            "condition": self._execute_condition,
        }

        executor = executors.get(node_kind)
        if not executor:
            logger.warning("Unknown node kind", node_kind=node_kind)
            return {"logs": [f"Unknown tool: {node_kind}"], "findings": []}

        return executor(node_config, targets, run_id, node_id)

    def _execute_demo(self, node_kind: str, node_config: Dict, targets: List[str]) -> Dict[str, Any]:
        """Execute in demo mode (mock execution)."""
        logs = [
            f"[DEMO MODE] Executing {node_kind}",
            f"[DEMO MODE] Targets: {', '.join(targets)}",
            f"[DEMO MODE] Config: {json.dumps(node_config, indent=2)}",
            f"[DEMO MODE] Execution completed successfully"
        ]

        findings = []

        # Add mock findings for recon tools
        if node_kind == "nmap":
            findings = [
                {
                    "id": str(uuid.uuid4()),
                    "severity": "medium",
                    "title": "Open Port Detected",
                    "description": "Port 22 (SSH) is open",
                    "service": "ssh",
                    "port": 22
                },
                {
                    "id": str(uuid.uuid4()),
                    "severity": "low",
                    "title": "Open Port Detected",
                    "description": "Port 80 (HTTP) is open",
                    "service": "http",
                    "port": 80
                }
            ]
        elif node_kind == "gitleaks":
            findings = [
                {
                    "id": str(uuid.uuid4()),
                    "severity": "critical",
                    "title": "Hardcoded API Key",
                    "description": "AWS API key found in config file",
                    "metadata": {"file": "config.env", "line": 42}
                }
            ]

        return {"logs": logs, "findings": findings}

    def _execute_nmap(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Execute Nmap scan in Docker container."""
        logs = []
        findings = []

        try:
            # Build nmap command
            scan_type = config.get("scanType", "quick")
            scan_flags = {
                "quick": "-T4 -F",
                "full": "-p-",
                "stealth": "-sS"
            }
            flags = scan_flags.get(scan_type, "-T4 -F")

            for target in targets:
                container_name = f"nmap-{run_id}-{node_id}-{uuid.uuid4().hex[:8]}"

                logs.append(f"Starting nmap scan for {target}")

                # Run Docker container
                container = self.docker_client.containers.run(
                    "instrumentisto/nmap:latest",
                    command=f"{flags} -oX /tmp/scan.xml {target}",
                    name=container_name,
                    detach=False,
                    remove=True,
                    network_mode="bridge",
                    mem_limit=settings.DOCKER_MEMORY_LIMIT,
                    cpu_period=100000,
                    cpu_quota=int(settings.DOCKER_CPU_LIMIT * 100000),
                    user="nobody"
                )

                logs.append(f"Nmap scan completed for {target}")

                # Parse results (simplified)
                # In production, parse XML output
                findings.append({
                    "id": str(uuid.uuid4()),
                    "severity": "medium",
                    "title": f"Scan completed for {target}",
                    "description": "Nmap scan results available"
                })

        except Exception as e:
            logger.error("Nmap execution failed", error=str(e))
            logs.append(f"ERROR: {str(e)}")
            raise

        return {"logs": logs, "findings": findings}

    def _execute_http_probe(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Execute HTTP probing."""
        logs = []
        findings = []

        for target in targets:
            logs.append(f"Probing HTTP services on {target}")
            # Simplified implementation
            findings.append({
                "id": str(uuid.uuid4()),
                "severity": "low",
                "title": "HTTP Service Detected",
                "description": f"HTTP service found on {target}"
            })

        return {"logs": logs, "findings": findings}

    def _execute_parser(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Execute parser/rules."""
        logs = [f"Applying rules: {config.get('rules', 'default')}"]
        return {"logs": logs, "findings": []}

    def _execute_gitleaks(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Execute Gitleaks for secret scanning."""
        logs = []
        findings = []

        repo_url = config.get("repoUrl", "")
        if not repo_url:
            logs.append("No repository URL provided")
            return {"logs": logs, "findings": []}

        logs.append(f"Scanning repository: {repo_url}")

        try:
            container_name = f"gitleaks-{run_id}-{node_id}-{uuid.uuid4().hex[:8]}"

            # Run Gitleaks in Docker
            self.docker_client.containers.run(
                "zricethezav/gitleaks:latest",
                command=f"detect --source {repo_url} --report-format json",
                name=container_name,
                detach=False,
                remove=True,
                mem_limit=settings.DOCKER_MEMORY_LIMIT,
                user="nobody"
            )

            logs.append("Gitleaks scan completed")

        except Exception as e:
            logger.error("Gitleaks execution failed", error=str(e))
            logs.append(f"ERROR: {str(e)}")

        return {"logs": logs, "findings": findings}

    def _execute_slack_alert(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Send alert to Slack."""
        logs = ["Slack notification would be sent here"]
        return {"logs": logs, "findings": []}

    def _execute_discord_alert(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Send alert to Discord."""
        logs = ["Discord notification would be sent here"]
        return {"logs": logs, "findings": []}

    def _execute_report_export(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Export report."""
        logs = ["Report export would be generated here"]
        return {"logs": logs, "findings": []}

    def _execute_delay(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Execute delay."""
        import time
        delay_seconds = config.get("seconds", 5)
        logs = [f"Waiting {delay_seconds} seconds..."]
        time.sleep(delay_seconds)
        logs.append("Delay completed")
        return {"logs": logs, "findings": []}

    def _execute_condition(self, config: Dict, targets: List[str], run_id: str, node_id: str) -> Dict[str, Any]:
        """Evaluate condition."""
        logs = [f"Evaluating condition: {config.get('condition', 'true')}"]
        return {"logs": logs, "findings": []}
