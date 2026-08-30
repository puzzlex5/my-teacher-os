#!/usr/bin/env python3
import json
import tempfile
import unittest
from pathlib import Path

import pairing_v44 as P


class PairingV44Tests(unittest.TestCase):
    def write_config(self, root: Path, nonce: str, expires: int = 2000) -> Path:
        path = root / 'bridge-config.json'
        path.write_text(json.dumps({'token':'T'*32,'pairNonce':nonce,'pairExpiresAt':expires}), encoding='utf-8')
        return path

    def test_one_time_exchange(self):
        nonce = 'N' * 43
        with tempfile.TemporaryDirectory() as td:
            path = self.write_config(Path(td), nonce)
            self.assertEqual(P.exchange(path, nonce, now=1000), 'T'*32)
            self.assertEqual(P.exchange(path, nonce, now=1000), '')
            data = json.loads(path.read_text(encoding='utf-8'))
            self.assertNotIn('pairNonce', data)
            self.assertNotIn('pairExpiresAt', data)

    def test_wrong_or_expired_nonce_fails(self):
        nonce = 'N' * 43
        with tempfile.TemporaryDirectory() as td:
            path = self.write_config(Path(td), nonce, expires=900)
            self.assertEqual(P.exchange(path, nonce, now=1000), '')
            path = self.write_config(Path(td), nonce, expires=2000)
            self.assertEqual(P.exchange(path, 'X'*43, now=1000), '')

    def test_nonce_format(self):
        self.assertTrue(P.valid_nonce('A'*43))
        self.assertFalse(P.valid_nonce('../bad'))


if __name__ == '__main__':
    unittest.main()
