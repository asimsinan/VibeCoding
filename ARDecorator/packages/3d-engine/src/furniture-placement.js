export class FurniturePlacementEngine {
    MIN_SCALE = 0.2;
    MAX_SCALE = 3.0;
    SNAP_ANGLES = [0, 90, 180, 270];
    validatePosition(position, dimensions, roomBounds) {
        const halfWidth = dimensions.width / 2;
        const halfDepth = dimensions.depth / 2;
        return (position.x - halfWidth >= 0 &&
            position.x + halfWidth <= roomBounds.width &&
            position.z - halfDepth >= 0 &&
            position.z + halfDepth <= roomBounds.depth &&
            position.y >= 0 &&
            position.y <= roomBounds.height);
    }
    detectCollision(item1, item2) {
        const box1 = this.getBoundingBox(item1);
        const box2 = this.getBoundingBox(item2);
        return (box1.minX < box2.maxX &&
            box1.maxX > box2.minX &&
            box1.minY < box2.maxY &&
            box1.maxY > box2.minY &&
            box1.minZ < box2.maxZ &&
            box1.maxZ > box2.minZ);
    }
    getBoundingBox(item) {
        const scaledWidth = item.dimensions.width * item.scale;
        const scaledHeight = item.dimensions.height * item.scale;
        const scaledDepth = item.dimensions.depth * item.scale;
        return {
            minX: item.position.x - scaledWidth / 2,
            maxX: item.position.x + scaledWidth / 2,
            minY: item.position.y,
            maxY: item.position.y + scaledHeight,
            minZ: item.position.z - scaledDepth / 2,
            maxZ: item.position.z + scaledDepth / 2,
        };
    }
    calculateOptimalPlacement(dimensions, roomBounds, existingItems) {
        const gridSize = 0.5;
        const attempts = 100;
        for (let i = 0; i < attempts; i++) {
            const x = Math.floor(Math.random() * (roomBounds.width / gridSize)) * gridSize;
            const z = Math.floor(Math.random() * (roomBounds.depth / gridSize)) * gridSize;
            const position = { x, y: 0, z };
            const testItem = {
                id: 'test',
                position,
                rotation: 0,
                scale: 1,
                dimensions,
            };
            if (this.validatePosition(position, dimensions, roomBounds)) {
                const hasCollision = existingItems.some((item) => this.detectCollision(testItem, item));
                if (!hasCollision) {
                    return position;
                }
            }
        }
        return null;
    }
    validateScale(scale) {
        return scale >= this.MIN_SCALE && scale <= this.MAX_SCALE;
    }
    enforceScaleLimits(scale) {
        return Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale));
    }
    maintainAspectRatio(originalDimensions, scale) {
        return {
            width: originalDimensions.width * scale,
            height: originalDimensions.height * scale,
            depth: originalDimensions.depth * scale,
        };
    }
    rotateFurniture(currentRotation, angle) {
        return (currentRotation + angle) % 360;
    }
    snapRotation(rotation, threshold = 15) {
        for (const snapAngle of this.SNAP_ANGLES) {
            if (Math.abs(rotation - snapAngle) <= threshold) {
                return snapAngle;
            }
        }
        return rotation;
    }
}
//# sourceMappingURL=furniture-placement.js.map