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
    add(other) { return new Vector(this.x + other.x, this.y + other.y) }
    subtract(other) { return new Vector(this.x - other.x, this.y - other.y) }
    dot(other) { return this.x * other.x + this.y * other.y }
    cross(other) { return this.x * other.y - this.y * other.x }
    multiply(scale) { return new Vector(this.x * scale, this.y * scale) }
    lerp(other, t) { return this.multiply(1 - t).add(other.multiply(t)) }
}

 class BoundryLine {
    constructor(point, heading, leftRegion, rightRegion) {
        this.point = point
        this.heading = heading
        this.leftRegion = leftRegion
        this.rightRegion = rightRegion
        this.forward = Infinity
        this.backward = -Infinity
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

    regionNormal(region) {
        return region == this.leftRegion ? this.heading.rightNormal : this.heading.leftNormal
    }

    get forwardPoint() {
        let distance = Math.min(this.forward, 10000)
        return this.point.add(this.heading.multiply(distance))
    }

    get backwardPoint() {
        let distance = Math.max(this.backward, -10000)
        return this.point.add(this.heading.multiply(distance))
    }
 }

 class VoronoiDiagram {

    constructor(points) {
        this.lines = []
        this.pointsToLines = []
        for (let i = 0; i < points.length; i++)
            this.pointsToLines.push([])

        this.points = []
        let added = new Set()
        for (let point of points) {
            let str = JSON.stringify(point)
            if (!added.has(str)) {
                added.add(str)
                this.points.push(point)
            }
        }

        this.idCounter = 0

        this.addPairBoundries()
        this.lines = this.lines.filter((line) => !line.fullyClipped)
        this.pointsToLines.forEach((lines, i) => {
            this.pointsToLines[i] = lines.filter((line) => !line.fullyClipped)
        })
    }

    addPairBoundries() {
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let pi = this.points[i]
                let pj = this.points[j]
                let midPoint = pi.lerp(pj, 0.5)
                let heading = pj.subtract(pi).rightNormal.unit
                this.addLine(new BoundryLine(midPoint, heading, j, i))
            }
        }
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
        let pointId = this.idCounter++
        a.clip(point, b.regionNormal(region))
        b.clip(point, a.regionNormal(region))
    }

    get polygons() {
        return this.pointsToLines.map((lines, i) => this.polygon(lines, i))
    }

    polygon(lines, region) {
        let points = []
        for (let line of lines) {
            points.push(line.forwardPoint)
            points.push(line.backwardPoint)
        }

        let centerPoint = this.points[region]
        points.sort((a, b) => a.subtract(centerPoint).angle - b.subtract(centerPoint).angle )

        return points
    }
 }