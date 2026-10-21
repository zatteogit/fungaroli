"""Real SVG path operations; semantics come only from reviewed annotations."""
import re
import pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform


def parse(geometry, transform=None, evenodd=False):
    result = pathops.Path()
    pen = result.getPen()
    if transform:
        match = re.fullmatch(r'translate\(([-\d.]+)[ ,]+([-\d.]+)\)', transform)
        if not match:
            raise ValueError(f'Unsupported SVG transform: {transform}')
        pen = TransformPen(pen, Transform().translate(*map(float, match.groups())))
    parse_path(geometry, pen)
    if evenodd:
        result.fillType = pathops.FillType.EVEN_ODD
    return result


def operation(first, second, kind):
    return pathops.op(first, second, kind)


def intersect(first, second):
    return operation(first, second, pathops.PathOp.INTERSECTION)


def subtract(first, second):
    return operation(first, second, pathops.PathOp.DIFFERENCE)


def union(first, second):
    return operation(first, second, pathops.PathOp.UNION)


def svg_path(geometry):
    pen = SVGPathPen(None)
    geometry.draw(pen)
    return pen.getCommands()


def visible_paints(traced_root):
    """Remove paint covered by subsequent opaque paths, preserving visible color.

    This is SVG compositing geometry, not anatomical segmentation. Only opaque,
    filled paths with the VTracer translate transforms are accepted.
    """
    paths = []
    for index, node in enumerate(traced_root):
        if node.tag.rsplit('}', 1)[-1] != 'path':
            raise ValueError('Expected only VTracer paths')
        if node.get('opacity', '1') != '1' or node.get('fill-opacity', '1') != '1':
            raise ValueError('Cannot flatten translucent paint')
        paths.append((index, node.get('fill'), parse(node.get('d'), node.get('transform'))))
    occluded = pathops.Path()
    visible = []
    for index, color, shape in reversed(paths):
        remaining = subtract(shape, occluded)
        visible.append((index, color, remaining))
        occluded = union(occluded, shape)
    return list(reversed(visible))
