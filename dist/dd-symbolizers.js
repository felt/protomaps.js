// @ts-ignore
import Point from "@mapbox/point-geometry";
import { GeomType } from "./tilecache";
// @ts-ignore
import { Justify, TextSymbolizer } from "./symbolizer";
export class DataDrivenOffsetSymbolizer {
    constructor(symbolizer, options) {
        this.getBbox = (anchor, bbOrigin, firstLabelBbox) => {
            return {
                minX: anchor.x + bbOrigin.x + firstLabelBbox.minX,
                minY: anchor.y + bbOrigin.y + firstLabelBbox.minY,
                maxX: anchor.x + bbOrigin.x + firstLabelBbox.maxX,
                maxY: anchor.y + bbOrigin.y + firstLabelBbox.maxY,
            };
        };
        this.symbolizer = symbolizer;
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        this.placements = options.placements || [
            2 /* NE */,
            6 /* SW */,
            8 /* NW */,
            4 /* SE */,
            1 /* N */,
            5 /* S */,
            3 /* E */,
            7 /* W */,
        ];
        this.attrs =
            options.attrs ||
                (() => {
                    return {};
                });
    }
    place(layout, geom, feature) {
        if (feature.geomType !== GeomType.Point)
            return undefined;
        let placed = this.symbolizer.place(layout, [[new Point(0, 0)]], feature);
        if (!placed || placed.length == 0)
            return undefined;
        const anchor = geom[0][0];
        const firstLabel = placed[0];
        const firstLabelBbox = firstLabel.bboxes[0];
        // Overwrite options values via the data driven function if exists
        let offsetXValue = this.offsetX;
        let offsetYValue = this.offsetY;
        let justifyValue = this.symbolizer.justify;
        let placements = this.placements;
        const { offsetX: ddOffsetX, offsetY: ddOffsetY, justify: ddJustify, placements: ddPlacements, } = this.attrs(layout.zoom, feature) || {};
        if (ddOffsetX)
            offsetXValue = ddOffsetX;
        if (ddOffsetY)
            offsetYValue = ddOffsetY;
        if (ddJustify)
            justifyValue = ddJustify;
        if (ddPlacements)
            placements = ddPlacements;
        for (let placement of placements) {
            const xAxisOffset = this.computeXAxisOffset(offsetXValue, firstLabelBbox, placement);
            const yAxisOffset = this.computeYAxisOffset(offsetYValue, firstLabelBbox, placement);
            const justify = this.computeJustify(justifyValue, placement);
            const origin = new Point(xAxisOffset, yAxisOffset);
            const validPlace = this.placeLabelInPoint(anchor, origin, layout, firstLabel, justify);
            if (validPlace)
                return validPlace;
        }
        return undefined;
    }
    placeLabelInPoint(anchor, bbOrigin, layout, firstLabel, justify) {
        const bbox = this.getBbox(anchor, bbOrigin, firstLabel.bboxes[0]);
        if (!layout.index.bboxCollides(bbox, layout.order))
            return [
                {
                    anchor: anchor,
                    bboxes: [bbox],
                    draw: this.getDrawFunction(bbOrigin, firstLabel, justify),
                },
            ];
    }
    getDrawFunction(origin, first_label, justify) {
        return (ctx) => {
            ctx.translate(origin.x, origin.y);
            first_label.draw(ctx, { justify: justify });
        };
    }
    computeXAxisOffset(offsetX, fb, placement) {
        const labelWidth = fb.maxX;
        const labelHalfWidth = labelWidth / 2;
        if ([1 /* N */, 5 /* S */].includes(placement))
            return offsetX - labelHalfWidth;
        if ([8 /* NW */, 7 /* W */, 6 /* SW */].includes(placement))
            return -offsetX - labelWidth;
        return offsetX;
    }
    computeYAxisOffset(offsetY, fb, placement) {
        const labelHalfHeight = Math.abs(fb.minY);
        const labelBottom = fb.maxY;
        const labelCenterHeight = (fb.minY + fb.maxY) / 2;
        if ([3 /* E */, 7 /* W */].includes(placement))
            return offsetY - labelCenterHeight;
        if ([8 /* NW */, 2 /* NE */, 1 /* N */].includes(placement))
            return -offsetY - labelBottom;
        if ([6 /* SW */, 4 /* SE */, 5 /* S */].includes(placement))
            return offsetY + labelHalfHeight;
        return offsetY;
    }
    computeJustify(fixedJustify, placement) {
        if (fixedJustify)
            return fixedJustify;
        if ([1 /* N */, 5 /* S */].includes(placement))
            return Justify.Center;
        if ([2 /* NE */, 3 /* E */, 4 /* SE */].includes(placement))
            return Justify.Left;
        return Justify.Right;
    }
}
export class DataDrivenOffsetTextSymbolizer {
    constructor(options) {
        this.symbolizer = new DataDrivenOffsetSymbolizer(new TextSymbolizer(options), options);
    }
    place(layout, geom, feature) {
        return this.symbolizer.place(layout, geom, feature);
    }
}
