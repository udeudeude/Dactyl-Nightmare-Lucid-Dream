"""Unit tests for the read-only SU2000 material and mesh analysis tools.

Run: python3 -m unittest discover -s scripts -p 'test_su2000_*.py'
"""
import importlib.util
import pathlib
import struct
import unittest

ROOT = pathlib.Path(__file__).parent

def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

class SU2000Tests(unittest.TestCase):
    def test_material_probe_rejects_nonmodels(self):
        survey = load("survey_su2000_materials")
        result, error = survey.parse(b"not a model")
        self.assertIsNone(result)
        self.assertEqual(error, "unsupported_version")

    def test_strict_polygon_layout(self):
        verify = load("verify_su2000_meshes")
        # Synthetic model only: 3 vertices and one triangle.
        blob = bytearray(140)
        blob[:8] = b"BIN 0200"
        struct.pack_into(">I", blob, 12, len(blob) - 16)
        struct.pack_into(">I", blob, 20, 24)
        # Short layout: base=16, vertex at 40, end 80,
        # polygon at 80, end 108, trailing section at 108.
        for at, value in zip((20,24,28,32,36), (24,64,64,92,92)):
            struct.pack_into(">I", blob, at, value)
        struct.pack_into(">I", blob, 40, 3)
        for index, xyz in enumerate(((0.,0.,0.),(1.,0.,0.),(0.,1.,0.))):
            struct.pack_into(">fff", blob, 44 + 12 * index, *xyz)
        struct.pack_into(">I", blob, 80, 1)
        struct.pack_into(">III", blob, 84, 3, 0x20c86464, 0)
        struct.pack_into(">III", blob, 96, 0, 1, 2)
        self.assertEqual(verify.inspect(blob), "valid")
        struct.pack_into(">I", blob, 104, 3)
        self.assertEqual(verify.inspect(blob), "out_of_range_index")

    def test_material_parser_accepts_synthetic_triangle(self):
        survey = load("survey_su2000_materials")
        blob = bytearray(140)
        blob[:8] = b"BIN 0200"
        struct.pack_into(">I", blob, 12, len(blob) - 16)
        for at, value in zip((20, 24, 28, 32, 36), (24, 64, 64, 92, 92)):
            struct.pack_into(">I", blob, at, value)
        struct.pack_into(">I", blob, 40, 3)
        struct.pack_into(">I", blob, 80, 1)
        struct.pack_into(">III", blob, 84, 3, 0x20c80000, 0)
        struct.pack_into(">III", blob, 96, 0, 1, 2)
        parsed, error = survey.parse(blob)
        self.assertIsNone(error)
        self.assertEqual(parsed[0][0x20c80000], 1)
        self.assertEqual(parsed[2], 1)

if __name__ == "__main__":
    unittest.main()
