class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
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
        return new Vector({ x: this.x * scale, y: this.y * scale })
    }
    toString() {
        return `(${this.x.toFixed(2)},${this.y.toFixed(2)})`
    }
}

class Line {
    constructor(a, b) {
        this.a = a
        this.b = b
    }
    get xDiff() {
        return (this.a.x - this.b.x)
    }
    get yDiff() {
        return (this.b.y - this.a.y)
    }
    get cVal() {
        return (this.yDiff * this.a.x + this.xDiff * this.a.y)
    }
    get length() {
        let magnitude = new Vector(this.xDiff, this.yDiff).length
        return magnitude
    }
    closestPointOnLine(point) {
        let perpLine = new Line(point.subtract(this.getPerpVector()), point.add(this.getPerpVector()))
        let closestPoint = this.findIntersection(perpLine)
        return closestPoint
    }
    intersect(otherLine) {
        let determinant = this.yDiff * otherLine.xDiff - otherLine.yDiff * this.xDiff
        return (determinant !== 0)
    }
    findIntersection(otherLine) {
        let determinant = this.yDiff * otherLine.xDiff - otherLine.yDiff * this.xDiff
        let intersectX = (otherLine.xDiff * this.cVal - this.xDiff * otherLine.cVal) / determinant
        let intersectY = (this.yDiff * otherLine.cVal - otherLine.yDiff * this.cVal) / determinant
        return new Vector(intersectX, intersectY)
    }
    isPointOnLine(point, minDistance = 1) {
        //rebuild me
        let closestPoint = this.closestPointOnLine(point)
        let distance = new Line(point, closestPoint).length
        let isOn = distance < minDistance
        //did this by hand to retain the sign
        let distanceX = closestPoint.x - this.a.x
        let lengthX = this.b.x - this.a.x
        let alphaX = distanceX / lengthX
        
        let distanceY = closestPoint.y - this.a.y
        let lengthY = this.b.y - this.a.y
        let alphaY = distanceY / lengthY

        let XValid = alphaX >= 0 && alphaX <= 1
        let YValid = alphaY >= 0 && alphaY <= 1
        if (lengthX == 0) {
            XValid = YValid
        }
        if (lengthY == 0) {
            YValid = XValid
        }
        let isOnLine = isOn && XValid && YValid
        return isOnLine
    }
    intersectOnLine(otherLine) {
        let intersection = this.findIntersection(otherLine)
        return this.isPointOnLine(intersection)
    }
    intersectOnBothLines(otherLine) {
        let intersection = this.findIntersection(otherLine)
        return (this.isPointOnLine(intersection) && otherLine.isPointOnLine(intersection))
    }
    lerp(alpha) {
        //alpha should only be 0-1
        let newX = this.a.x - this.xDiff * alpha
        let newY = this.a.y + this.yDiff * alpha
        return new Vector(newX, newY)
    }
    get perpVector() {
        return new Vector(-this.yDiff, -this.xDiff)
    }
    toString() {
        return `${this.a}-${this.b}`
    }
}
class VoroPoly {
    constructor(point) {
        //box is the default lines
        let unit = 200
        this.lines = [
            new Line(
                new Vector(0, 0),
                new Vector(500, 0)
            ),
            new Line(
                new Vector(500, 0),
                new Vector(500, 500)
            ),
            new Line(
                new Vector(500, 500),
                new Vector(0, 500),
            ),
            new Line(
                new Vector(0, 500),
                new Vector(0, 0),
            )
        ]
        this.point = point
    }
    update(newPoint) {
        //creates perpendicular newLine
        if (newPoint !== this.point) {
            let directionalLine = new Line(newPoint, this.point)
            let perpVector = directionalLine.perpVector
            let perpLine = new Line (
                directionalLine.lerp(0.5).subtract(perpVector),
                directionalLine.lerp(0.5).add(perpVector)
            )
            let twoIntersections = []
            for (let i = 0; i < this.lines.length; i++) {
    
                if (this.lines[i].intersectOnLine(perpLine)) {
                    //save the intersections
                    twoIntersections.push(i)
                }
            }
            //check for only two intersections
            if (twoIntersections.length >= 2) {
                // minimize perp line so there is no excess
                perpLine.a = this.lines[twoIntersections[0]].findIntersection(perpLine)
                perpLine.b = this.lines[twoIntersections[1]].findIntersection(perpLine)
                this.lines.push(perpLine)
                for (let index of twoIntersections) {
                    let checkA = new Line(this.point, this.lines[index].a)
                    let checkB = new Line(this.point, this.lines[index].b)
                    let intersection = this.lines[index].findIntersection(perpLine)             
                    if (checkA.intersectOnLine(perpLine)) {
                        this.lines[index].a = intersection
                    }
                    if (checkB.intersectOnLine(perpLine)) {
                        this.lines[index].b = intersection
                    }
                }
                // check the lines that collide with the new one and reassign their invalid point
                // remove extra points outside the box
                for (let i = 0; i < this.lines.length; i++) {
                    let midLine = new Line(this.lines[i].lerp(0.5), this.point)
                    if (midLine.intersectOnLine(perpLine) && this.lines[i] !== perpLine) {
                        this.lines.splice(i, 1)
                    }
                }
            }
        }
        this.clean()
    }
    clean() {
        //filter
        this.lines = this.lines.filter( (line, index) => {
            for (let i = 0; i < this.lines.length; i++) {
                let dupCheck = this.lines[i]
                let floatCheck = new Line(line.lerp(0.5), this.point)
                //duplicate check
                if (index !== i && line.toString() == dupCheck.toString()) {
                    console.log("removed clone")
                    return false
                }
                //floating check
                if (index !== i && floatCheck.intersectOnBothLines(this.lines[i])) {
                    return false
                }
            }
            return true
        })
    }
}
class DelauneyCircle {
    constructor(one, two, three) {
        this.points = [one, two, three]
    }
    get center() {
        let [ one, two, three ] = this.points
        let chordOne = new Line(one, two)
        let chordTwo = new Line(two, three)
        let perpOne = new Line(chordOne.lerp(0.5), chordOne.lerp(0.5).add(chordOne.perpVector))
        let perpTwo = new Line(chordTwo.lerp(0.5), chordTwo.lerp(0.5).add(chordTwo.perpVector))
        return perpOne.findIntersection(perpTwo)
    }
    get radius() {
        return this.points[0].subtract(this.center).length
    }
    contains(point) {
        let dist = new Line(point, this.center).length
        return dist <= this.radius
    }
}