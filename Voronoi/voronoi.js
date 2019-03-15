class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    get lengthSquared() {
        return this.x * this.x + this.y * this.y
    }
    get unit() {
        return this.multiply(1 / this.length)
    }
    get perpVector() {
        return new Vector(-this.y, this.x)
    }
    add(addedVector) {
        return new Vector(this.x + addedVector.x, this.y + addedVector.y)
    }
    subtract(subtractedVector) {
        return new Vector(this.x - subtractedVector.x, this.y - subtractedVector.y)
    }
    dot(other) {
        return this.x * other.x + this.y * other.y
    }
    multiply(scale) {
        return new Vector(this.x * scale, this.y * scale)
    }
    toString() {
        return `(${this.x.toFixed(2)},${this.y.toFixed(2)})`
    }
}

function timeToIntersection(a, av, b, bv) {
    let n = bv.perpVector
    return b.subtract(a).dot(n) / av.dot(n)
}

function pointOfIntersection(a, av, b, bv) {
    let t = timeToIntersection(a, av, b, bv)
    return a.add(av.multiply(t))
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
        if (this.intersectionPointOnLine(point) && other.intersectionPointOnLine(point))
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