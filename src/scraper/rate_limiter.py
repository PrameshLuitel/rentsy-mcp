import asyncio
import time
from typing import Callable, Any


class RateLimiter:
    def __init__(self, delay: float = 0.5):
        self.delay = delay
        self.last_request_time = 0
        self.consecutive_failures = 0

    async def wait(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.delay:
            await asyncio.sleep(self.delay - elapsed)
        self.last_request_time = time.time()

    def report_failure(self):
        self.consecutive_failures += 1
        self.delay = min(self.delay * 2, 30.0)

    def report_success(self):
        if self.consecutive_failures > 0:
            self.consecutive_failures = 0
        self.delay = max(self.delay * 0.9, 0.2)


async def with_retry(func: Callable, max_retries: int = 3, initial_delay: float = 1.0, *args, **kwargs) -> Any:
    retries = 0
    delay = initial_delay
    while retries < max_retries:
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            retries += 1
            if retries == max_retries:
                raise e
            print(f"Attempt {retries} failed: {e}. Retrying in {delay}s...")
            await asyncio.sleep(delay)
            delay *= 2
