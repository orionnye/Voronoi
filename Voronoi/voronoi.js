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
    get angle() { return Math.atan2(this.y, this.x) }
    get negate() { return new Vector(-this.x, -this.y) }
    add(other) { return new Vector(this.x + other.x, this.y + other.y) }
    subtract(other) { return new Vector(this.x - other.x, this.y - other.y) }
    dot(other) { return this.x * other.x + this.y * other.y }
    cross(other) { return this.x * other.y - this.y * other.x }
    multiply(scale) { return new Vector(this.x * scale, this.y * scale) }
    lerp(other, t) { return this.multiply(1 - t).add(other.multiply(t)) }
}

 class Line {
    constructor(point, heading, normal = null) {
        this.point = point
        this.heading = heading
        this.forward = Infinity
        this.backward = -Infinity
        this.normal = normal
    }

    timeToIntersection(other) {
        let n = other.heading.leftNormal
        return other.point.subtract(this.point).dot(n) / this.heading.dot(n)
    }

    pointOfIntersection(other) {
        let t = this.timeToIntersection(other)
        if (Number.isFinite(t))
            return this.point.add(this.heading.multiply(t))
        return null
    }

    clip(point, normal) {
        let projection = this.heading.dot(point.subtract(this.point))
        let forward = this.heading.dot(normal) >= 0
        if (forward)
            this.forward = Math.min(this.forward, projection)
        else
            this.backward = Math.max(this.backward, projection)
    }

    get fullyClipped() {
        return this.forward < this.backward
    }

    outerNormal(innerPoint) {
        if (this.normal != null)
            return this.normal
        let normal = this.heading.rightNormal
        let negate = this.point.subtract(innerPoint).dot(normal) < 0
        return negate ? normal.negate : normal
    }

    get forwardPoint() {
        return this.point.add(this.heading.multiply(this.forward))
    }

    get backwardPoint() {
        return this.point.add(this.heading.multiply(this.backward))
    }
 }

class Polygon {
    constructor(point) {
        this.point = point
        this.lines = []
    }

    addLine(line) {
        for (let otherLine of this.lines)
            this.clip(line, otherLine)
        this.lines.push(line)
    }

    clip(a, b) {
        let point = a.pointOfIntersection(b)
        if (point == null)
            return
        a.clip(point, b.outerNormal(this.point))
        b.clip(point, a.outerNormal(this.point))
    }

    cleanup() {
        this.lines = this.lines.filter((line) => !line.fullyClipped)
    }

    sortedPoints() {
        let points = []
        for (let line of this.lines) {
            points.push(line.forwardPoint)
            points.push(line.backwardPoint)
        }
        let average = points.reduce((a, b) => a.add(b), new Vector(0, 0)).multiply(1 / points.length)
        points.sort((a, b) => a.subtract(average).angle - b.subtract(average).angle )
        return points
    }
}
 class VoronoiDiagram {

    constructor(points, boundaryPoints) {
        this.polygons = []
        let added = new Set()
        for (let point of points) {
            let str = JSON.stringify(point)
            if (!added.has(str)) {
                added.add(str)
                this.polygons.push(new Polygon(point))
            }
        }

        this.clipToBounds(boundaryPoints)
        this.addPairBoundries()
        for (let polygon of this.polygons)
            polygon.cleanup()
    }

    addPairBoundries() {
        for (let i = 0; i < this.polygons.length; i++) {
            for (let j = i + 1; j < this.polygons.length; j++) {
                let pli = this.polygons[i]
                let plj = this.polygons[j]
                let pi = pli.point
                let pj = plj.point
                let midPoint = pi.lerp(pj, 0.5)
                let heading = pj.subtract(pi).rightNormal.unit
                let line = new Line(midPoint, heading)
                pli.addLine(line)
                plj.addLine(line)
            }
        }
    }

    clipToBounds(points) {
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length
            let pi = points[i]
            let pj = points[j]
            let heading = pj.subtract(pi).unit
            let normal = heading.rightNormal
            for (let polygon of this.polygons)
                polygon.addLine(new Line(pi, heading, normal))
        }
    }
 }