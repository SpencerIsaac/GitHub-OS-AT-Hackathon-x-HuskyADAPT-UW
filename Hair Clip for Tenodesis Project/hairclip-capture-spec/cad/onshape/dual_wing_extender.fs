FeatureScript 2733;
import(path : "onshape/std/common.fs", version : "2733.0");
import(path : "onshape/std/geometry.fs", version : "2733.0");
import(path : "onshape/std/sketch.fs", version : "2733.0");
import(path : "onshape/std/extrude.fs", version : "2733.0");

annotation { "Feature Type Name" : "Dual Wing Extender" }
export const dualWingExtender = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Attachment opening", "Default" : 8 * millimeter }
        isLength(definition.attachmentOpening, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Insertion depth", "Default" : 6 * millimeter }
        isLength(definition.insertionDepth, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Lever length", "Default" : 18 * millimeter }
        isLength(definition.leverLength, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Tolerance band", "Default" : 0.8 * millimeter }
        isLength(definition.toleranceBand, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Clamp wall thickness", "Default" : 2.4 * millimeter }
        isLength(definition.wallThickness, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Lever width", "Default" : 10 * millimeter }
        isLength(definition.leverWidth, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Lever thickness", "Default" : 3.2 * millimeter }
        isLength(definition.leverThickness, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Thumb pad length", "Default" : 16 * millimeter }
        isLength(definition.thumbPadLength, POSITIVE_LENGTH_BOUNDS);

        annotation { "Name" : "Thumb pad width", "Default" : 12 * millimeter }
        isLength(definition.thumbPadWidth, POSITIVE_LENGTH_BOUNDS);
    }
    {
        const opening = definition.attachmentOpening + definition.toleranceBand;
        const outerWidth = opening + (2 * definition.wallThickness);
        const bodyLength = max(definition.insertionDepth + definition.leverLength, 12 * millimeter);

        var outerSketch = newSketch(context, id + "outerSketch", {
                    "sketchPlane" : qCreatedBy(makeId("Top"), EntityType.FACE)
                });
        skRectangle(outerSketch, "outerRect", {
                    "firstCorner" : vector(0, 0) * millimeter,
                    "secondCorner" : vector(bodyLength / millimeter, outerWidth / millimeter) * millimeter
                });
        skSolve(outerSketch);

        opExtrude(context, id + "outerExtrude", {
                    "entities" : qSketchRegion(id + "outerSketch"),
                    "direction" : vector(0, 0, 1),
                    "endBound" : BoundingType.BLIND,
                    "depth" : definition.leverThickness
                });

        var slotSketch = newSketch(context, id + "slotSketch", {
                    "sketchPlane" : qCreatedBy(makeId("Top"), EntityType.FACE)
                });
        skRectangle(slotSketch, "slotRect", {
                    "firstCorner" : vector(0, definition.wallThickness / millimeter) * millimeter,
                    "secondCorner" : vector(definition.insertionDepth / millimeter, (definition.wallThickness + opening) / millimeter) * millimeter
                });
        skSolve(slotSketch);

        opExtrude(context, id + "slotCut", {
                    "entities" : qSketchRegion(id + "slotSketch"),
                    "direction" : vector(0, 0, 1),
                    "endBound" : BoundingType.BLIND,
                    "depth" : definition.leverThickness,
                    "operationType" : NewBodyOperationType.REMOVE
                });

        var padSketch = newSketch(context, id + "padSketch", {
                    "sketchPlane" : qCreatedBy(makeId("Top"), EntityType.FACE)
                });
        skRectangle(padSketch, "padRect", {
                    "firstCorner" : vector((bodyLength - definition.thumbPadLength) / millimeter, (outerWidth - definition.thumbPadWidth) / (2 * millimeter)) * millimeter,
                    "secondCorner" : vector(bodyLength / millimeter, (outerWidth + definition.thumbPadWidth) / (2 * millimeter)) * millimeter
                });
        skSolve(padSketch);

        opExtrude(context, id + "padExtrude", {
                    "entities" : qSketchRegion(id + "padSketch"),
                    "direction" : vector(0, 0, 1),
                    "endBound" : BoundingType.BLIND,
                    "depth" : definition.leverThickness / 2,
                    "startBound" : BoundingType.BLIND,
                    "startDepth" : definition.leverThickness
                });
    });
