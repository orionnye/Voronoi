class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    get length() { return Math.sqrt(this.x * this.x + this.y * this.y) }
    get lengthSquared() { return this.x * this.x + this.y * this.y }
    get unit() { return this.multiply(1 / this.length) }
    get leftNormal() { return new Vector(-this.y, this.x) }
    get rightNormal() { return new Vector(this.y, -this.x) }
    add(addedVector) { return new Vector(this.x + addedVector.x, this.y + addedVector.y) }
    subtract(subtractedVector) { return new Vector(this.x - subtractedVector.x, this.y - subtractedVector.y) }
    dot(other) { return this.x * other.x + this.y * other.y }
    multiply(scale) { return new Vector(this.x * scale, this.y * scale) }
    lerp(other, t) { return this.multiply(1 - t).add(other.multiply(t)) }
}

function timeToIntersection(a, av, b, bv) {
    let n = bv.leftNormal
    return b.subtract(a).dot(n) / av.dot(n)
}

function pointOfIntersection(a, av, b, bv) {
    let t = timeToIntersection(a, av, b, bv)
    if (Number.isFinite(t))
        return a.add(av.multiply(t))
    return null
}
class Line {
    constructor(a, b) {
        this.a = a
        this.b = b
    }
    intersect(other) {
        let thisPoint = this.a
        let thisHeading = this.b.subtract(this.a)
        let otherPoint = other.a
        let otherHeading = other.b.subtract(other.a)
        let point = pointOfIntersection(thisPoint, thisHeading, otherPoint, otherHeading)
        if (point != null && this.intersectionPointOnLine(point) && other.intersectionPointOnLine(point))
            return point
        else
            return null
    }
    intersectionPointOnLine(point) {
        let heading = this.b.subtract(this.a)
        let dot = heading.dot(point.subtract(this.a))
        return dot > 0 && dot < this.lengthSquared
    }
    get lengthSquared() {
        return this.a.subtract(this.b).lengthSquared
    }
 }

 class BoundryLine {
    constructor(point, heading, rightRegion, leftRegion) {
        this.point = point
        this.heading = heading
        this.leftRegion = rightRegion
        this.rightRegion = leftRegion
        this.forwardBound = Infinity
        this.backwardBound = -Infinity
    }

    clip(point, normal) {
        let projection = this.heading.dot(point.subtract(this.point))
        let forward = this.heading.dot(normal) >= 0
        if (forward)
            this.forwardBound = Math.min(this.forwardBound, projection)
        else
            this.backwardBound = Math.max(this.backwardBound, projection)
    }

    get fullyClipped() {
        return this.forwardBound < this.backwardBound
    }

    regionNormal(region) {
        return region == this.rightRegion ? this.heading.rightNormal : this.heading.leftNormal
    }

    get forwardPoint() {
        let distance = Math.min(this.forwardBound, 1000)
        return this.point.add(this.heading.multiply(distance))
    }

    get backwardPoint() {
        let distance = Math.max(this.backwardBound, -1000)
        return this.point.add(this.heading.multiply(distance))
    }
 }

 class VoronoiDiagram {

    constructor(points) {
        this.lines = []
        this.pointsToLines = []
        for (let i = 0; i < points.length; i++)
            this.pointsToLines.push([])
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                let pi = points[i]
                let pj = points[j]
                let midPoint = pi.lerp(pj, 0.5)
                let heading = pj.subtract(pi).rightNormal.unit
                this.addLine(new BoundryLine(midPoint, heading, i, j))
            }
        }

        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].fullyClipped)
                this.lines[i] = null
        }

        this.lines = this.lines.filter((e) => e != null)
    }

    addLine(line) {
        this.lines.push(line)
        this.addLineToRegion(line, line.rightRegion)
        this.addLineToRegion(line, line.leftRegion)
    }

    addLineToRegion(line, region) {
        let regionLines = this.pointsToLines[region]
        for (let i = 0; i < regionLines.length; i++)
            this.clip(line, regionLines[i], region)
        regionLines.push(line)
    }

    clip(a, b, region) {
        let point = pointOfIntersection(a.point, a.heading, b.point, b.heading)
        a.clip(point, b.regionNormal(region))
        b.clip(point, a.regionNormal(region))
    }
 }