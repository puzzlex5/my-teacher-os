#!/usr/bin/env python3
import unittest

import watchdog_v45 as W


class WatchdogV45Tests(unittest.TestCase):
    def test_backoff_is_bounded(self):
        self.assertEqual(W.next_delay(0), 5)
        self.assertEqual(W.next_delay(1), 10)
        self.assertEqual(W.next_delay(5), 160)
        self.assertEqual(W.next_delay(20), 300)

    def test_health_payload_requires_supported_bridge(self):
        self.assertFalse(W.health_payload_ok({'ok': True, 'version': '44.0'}))
        self.assertFalse(W.health_payload_ok({'ok': True, 'version': '45.2'}))
        self.assertTrue(W.health_payload_ok({'ok': True, 'version': '46.0'}))
        self.assertTrue(W.health_payload_ok({'ok': True, 'version': '47.1'}))
        self.assertFalse(W.health_payload_ok({'ok': True, 'version': '38.0'}))
        self.assertFalse(W.health_payload_ok({'ok': False, 'version': '46.0'}))
        self.assertFalse(W.health_payload_ok({'ok': True, 'version': 'bad'}))


if __name__ == '__main__':
    unittest.main()
