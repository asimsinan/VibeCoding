export class DesignCalculator {
    calculateTotalCost(design, discountRules = []) {
        if (design.furniture.length === 0) {
            return 0;
        }
        const subtotal = design.furniture.reduce((sum, item) => sum + item.price, 0);
        const discount = this.calculateDiscount(design.furniture.length, subtotal, discountRules);
        return subtotal - discount;
    }
    calculateDiscount(itemCount, subtotal, rules) {
        const applicableRule = rules
            .filter((rule) => itemCount >= rule.minItems)
            .sort((a, b) => b.discountPercent - a.discountPercent)[0];
        if (!applicableRule) {
            return 0;
        }
        return subtotal * (applicableRule.discountPercent / 100);
    }
    calculateFloorSpaceUsed(design) {
        return design.placements.reduce((total, placement) => {
            const scaledWidth = placement.dimensions.width * placement.scale;
            const scaledDepth = placement.dimensions.depth * placement.scale;
            return total + scaledWidth * scaledDepth;
        }, 0);
    }
    calculateRoomUtilization(design) {
        const floorSpaceUsed = this.calculateFloorSpaceUsed(design);
        const totalFloorSpace = design.roomBounds.width * design.roomBounds.depth;
        if (totalFloorSpace === 0) {
            return 0;
        }
        return (floorSpaceUsed / totalFloorSpace) * 100;
    }
    validateDesign(design) {
        const errors = [];
        // Check if design has at least one furniture item
        if (design.furniture.length === 0) {
            errors.push('Design must have at least one furniture item');
        }
        // Check if all furniture items are within room bounds
        design.placements.forEach((placement, index) => {
            const scaledWidth = placement.dimensions.width * placement.scale;
            const scaledDepth = placement.dimensions.depth * placement.scale;
            const scaledHeight = placement.dimensions.height * placement.scale;
            if (placement.position.x - scaledWidth / 2 < 0 ||
                placement.position.x + scaledWidth / 2 > design.roomBounds.width ||
                placement.position.z - scaledDepth / 2 < 0 ||
                placement.position.z + scaledDepth / 2 > design.roomBounds.depth ||
                placement.position.y + scaledHeight > design.roomBounds.height) {
                errors.push(`Furniture item ${index + 1} is outside room bounds`);
            }
        });
        // Check for overlapping furniture
        for (let i = 0; i < design.placements.length; i++) {
            for (let j = i + 1; j < design.placements.length; j++) {
                if (this.checkOverlap(design.placements[i], design.placements[j])) {
                    errors.push(`Furniture items ${i + 1} and ${j + 1} are overlapping`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    checkOverlap(item1, item2) {
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
}
//# sourceMappingURL=design-calculator.js.map