from collections import OrderedDict
from copy import deepcopy
from threading import RLock
from time import monotonic


class TTLCache:
    def __init__(self, ttl_seconds, max_entries=32, clock=monotonic):
        if ttl_seconds <= 0 or max_entries < 1:
            raise ValueError("TTL and capacity must be positive")
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self.clock = clock
        self._entries = OrderedDict()
        self._lock = RLock()

    def get_or_set(self, key, loader):
        with self._lock:
            now = self.clock()
            for expired_key in list(self._entries):
                if self._entries[expired_key][0] <= now:
                    del self._entries[expired_key]
            if key in self._entries:
                self._entries.move_to_end(key)
                return deepcopy(self._entries[key][1])
            value = loader()
            self._entries[key] = (self.clock() + self.ttl_seconds, deepcopy(value))
            if len(self._entries) > self.max_entries:
                self._entries.popitem(last=False)
            return value

    def clear(self):
        with self._lock:
            self._entries.clear()