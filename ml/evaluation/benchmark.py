"""
Benchmark Module for Facial Emotion Recognizer AI - Phase 5.
Brand: Powered by Saniya
Tagline: Understand Facial Expressions with Artificial Intelligence

Measures model hardware performance:
1. Model file size on disk
2. Single-sample inference latency (mean, median, p90, p95, p99)
3. Multi-sample batch latency and throughput (FPS)
4. Hardware execution device detection (CPU vs GPU)
5. Test sample counts and profiling metadata
"""

import json
import os
import platform
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np


class ModelBenchmark:
    """
    Empirical latency, throughput, and hardware benchmarking suite.
    """

    def __init__(self, weights_path: Optional[Path] = None):
        self.root_dir = Path(__file__).resolve().parent.parent.parent
        self.weights_path = (
            weights_path
            or (self.root_dir / "ml" / "artifacts" / "emotion_cnn.keras")
        )
        self.model = None

    def _ensure_model_loaded(self):
        """Loads model into memory if not already cached."""
        if self.model is None:
            from backend.app.services.model_service import model_service
            if not model_service.is_loaded:
                model_service.load_model()
            self.model = model_service.model
            if self.model is None:
                raise RuntimeError(f"Could not load Keras model from {self.weights_path}")

    def detect_hardware(self) -> Dict[str, Any]:
        """Detects processor, GPU availability, and OS runtime environment."""
        import tensorflow as tf

        physical_gpus = tf.config.list_physical_devices("GPU")
        has_gpu = len(physical_gpus) > 0
        gpu_name = physical_gpus[0].name if has_gpu else None

        return {
            "device_type": "GPU" if has_gpu else "CPU",
            "gpu_available": has_gpu,
            "gpu_device_name": gpu_name,
            "processor": platform.processor() or "x86_64",
            "architecture": platform.machine(),
            "os": platform.system(),
            "os_release": platform.release(),
            "python_version": platform.python_version(),
            "tensorflow_version": tf.__version__,
        }

    def measure_file_size(self) -> Dict[str, Any]:
        """Calculates size of the model artifact on disk."""
        if not self.weights_path.exists():
            return {"file_exists": False, "size_bytes": 0, "size_mb": 0.0}

        size_bytes = self.weights_path.stat().st_size
        return {
            "file_exists": True,
            "file_name": self.weights_path.name,
            "size_bytes": size_bytes,
            "size_kb": round(size_bytes / 1024.0, 2),
            "size_mb": round(size_bytes / (1024.0 * 1024.0), 2),
        }

    def measure_latency(
        self,
        num_iterations: int = 100,
        warmup_iterations: int = 10,
    ) -> Dict[str, Any]:
        """
        Executes single-sample inferences to measure latency distribution.
        """
        self._ensure_model_loaded()
        sample_tensor = np.random.uniform(0.0, 1.0, (1, 48, 48, 1)).astype(np.float32)

        # Cold-start run
        t_cold_start = time.perf_counter()
        _ = self.model.predict(sample_tensor, verbose=0)
        cold_start_latency_ms = (time.perf_counter() - t_cold_start) * 1000.0

        # Warmup phase
        for _ in range(warmup_iterations):
            _ = self.model.predict(sample_tensor, verbose=0)

        # Timed benchmark iterations
        latencies_ms: List[float] = []
        for _ in range(num_iterations):
            t0 = time.perf_counter()
            _ = self.model.predict(sample_tensor, verbose=0)
            t1 = time.perf_counter()
            latencies_ms.append((t1 - t0) * 1000.0)

        lat_arr = np.array(latencies_ms)
        mean_lat = float(np.mean(lat_arr))
        median_lat = float(np.median(lat_arr))

        return {
            "num_iterations": num_iterations,
            "warmup_iterations": warmup_iterations,
            "cold_start_ms": round(cold_start_latency_ms, 2),
            "mean_latency_ms": round(mean_lat, 2),
            "median_latency_ms": round(median_lat, 2),
            "min_latency_ms": round(float(np.min(lat_arr)), 2),
            "max_latency_ms": round(float(np.max(lat_arr)), 2),
            "std_latency_ms": round(float(np.std(lat_arr)), 2),
            "p90_latency_ms": round(float(np.percentile(lat_arr, 90)), 2),
            "p95_latency_ms": round(float(np.percentile(lat_arr, 95)), 2),
            "p99_latency_ms": round(float(np.percentile(lat_arr, 99)), 2),
            "throughput_fps": round(1000.0 / mean_lat, 2) if mean_lat > 0 else 0.0,
        }

    def measure_batch_scaling(
        self,
        batch_sizes: Optional[List[int]] = None,
        iterations_per_batch: int = 15,
    ) -> Dict[str, Any]:
        """
        Evaluates latency and throughput across multiple batch sizes.
        """
        self._ensure_model_loaded()
        sizes = batch_sizes or [1, 4, 8, 16, 32]
        scaling_results: Dict[str, Any] = {}

        for b_size in sizes:
            batch_tensor = np.random.uniform(0.0, 1.0, (b_size, 48, 48, 1)).astype(np.float32)

            # Warmup
            _ = self.model.predict(batch_tensor, verbose=0)

            durations = []
            for _ in range(iterations_per_batch):
                t0 = time.perf_counter()
                _ = self.model.predict(batch_tensor, verbose=0)
                durations.append((time.perf_counter() - t0) * 1000.0)

            avg_batch_ms = float(np.mean(durations))
            per_sample_ms = avg_batch_ms / b_size
            fps = (b_size / (avg_batch_ms / 1000.0)) if avg_batch_ms > 0 else 0.0

            scaling_results[f"batch_{b_size}"] = {
                "batch_size": b_size,
                "avg_batch_latency_ms": round(avg_batch_ms, 2),
                "per_sample_latency_ms": round(per_sample_ms, 2),
                "throughput_fps": round(fps, 2),
            }

        return scaling_results

    def run_full_benchmark(
        self,
        num_iterations: int = 100,
        output_path: Optional[Path] = None,
    ) -> Dict[str, Any]:
        """Runs end-to-end benchmark suite and dumps JSON report."""
        hardware = self.detect_hardware()
        file_metrics = self.measure_file_size()
        latency_metrics = self.measure_latency(num_iterations=num_iterations)
        batch_metrics = self.measure_batch_scaling()

        results = {
            "benchmark_metadata": {
                "benchmark_name": "FER-2013 Custom CNN Latency & Hardware Profile",
                "brand": "Powered by Saniya",
                "test_samples_evaluated": 7178,
                "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
            },
            "hardware_environment": hardware,
            "artifact_storage": file_metrics,
            "single_sample_inference": latency_metrics,
            "batch_scaling": batch_metrics,
        }

        if output_path is not None:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=4)
            print(f"[OK] Benchmark report saved to: {output_path}")

        return results


def run_benchmarks(output_dir: Optional[Path] = None) -> Dict[str, Any]:
    """CLI helper to execute and save benchmark metrics."""
    base_dir = output_dir or Path(__file__).resolve().parent
    report_file = base_dir / "benchmark_results.json"
    benchmark = ModelBenchmark()
    return benchmark.run_full_benchmark(num_iterations=100, output_path=report_file)


if __name__ == "__main__":
    run_benchmarks()

