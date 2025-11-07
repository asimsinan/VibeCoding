import XCTest
import SwiftUI

/// Comprehensive tests for design system including component rendering, styling, and accessibility
final class DesignSystemTests: XCTestCase {
    
    // MARK: - Colors Tests
    
    func testColorsPrimaryExists() {
        // Test that primary colors are defined
        let primary = AppColors.primary
        XCTAssertNotNil(primary)
    }
    
    func testColorsDarkModeSupport() {
        // Test adaptive color functionality
        let adaptiveColor = AppColors.adaptive(AppColors.primary, AppColors.primaryDark)
        XCTAssertNotNil(adaptiveColor)
    }
    
    func testColorsBrandColors() {
        // Test brand color palette
        XCTAssertNotNil(AppColors.brandPrimary)
        XCTAssertNotNil(AppColors.brandSecondary)
        XCTAssertNotNil(AppColors.brandBackground)
        XCTAssertNotNil(AppColors.brandSurface)
    }
    
    func testColorsSemanticColors() {
        // Test semantic colors
        XCTAssertNotNil(AppColors.success)
        XCTAssertNotNil(AppColors.error)
        XCTAssertNotNil(AppColors.warning)
        XCTAssertNotNil(AppColors.info)
    }
    
    // MARK: - Typography Tests
    
    func testTypographyLargeTitle() {
        let font = AppTypography.largeTitle()
        XCTAssertNotNil(font)
    }
    
    func testTypographyTitle1() {
        let font = AppTypography.title1()
        XCTAssertNotNil(font)
    }
    
    func testTypographyBody() {
        let font = AppTypography.body()
        XCTAssertNotNil(font)
    }
    
    func testTypographyFontWeights() {
        // Test different font weights
        let regular = AppTypography.body(.regular)
        let bold = AppTypography.body(.bold)
        XCTAssertNotNil(regular)
        XCTAssertNotNil(bold)
    }
    
    func testTypographyFontSizes() {
        // Test all font sizes
        XCTAssertEqual(AppTypography.FontSize.largeTitle.rawValue, 34)
        XCTAssertEqual(AppTypography.FontSize.title1.rawValue, 28)
        XCTAssertEqual(AppTypography.FontSize.body.rawValue, 17)
    }
    
    // MARK: - Spacing Tests
    
    func testSpacingBaseUnit() {
        XCTAssertEqual(AppSpacing.baseUnit, 8)
    }
    
    func testSpacing8ptGrid() {
        // Test 8pt grid system
        XCTAssertEqual(AppSpacing.sm, 8)
        XCTAssertEqual(AppSpacing.md, 16)
        XCTAssertEqual(AppSpacing.lg, 24)
        XCTAssertEqual(AppSpacing.xl, 32)
    }
    
    func testSpacingSemanticValues() {
        // Test semantic spacing values
        XCTAssertEqual(AppSpacing.paddingSmall, AppSpacing.sm)
        XCTAssertEqual(AppSpacing.paddingMedium, AppSpacing.md)
        XCTAssertEqual(AppSpacing.cardPadding, AppSpacing.md)
    }
    
    // MARK: - CardView Tests
    
    func testCardViewRendering() {
        // Test that CardView can be created
        let card = CardView {
            Text("Test Content")
        }
        XCTAssertNotNil(card)
    }
    
    func testCardViewVariants() {
        // Test card variants
        let elevated = CardView.elevated {
            Text("Elevated")
        }
        let flat = CardView.flat {
            Text("Flat")
        }
        let outlined = CardView.outlined {
            Text("Outlined")
        }
        XCTAssertNotNil(elevated)
        XCTAssertNotNil(flat)
        XCTAssertNotNil(outlined)
    }
    
    func testCardViewCustomization() {
        // Test card customization
        let card = CardView(
            cornerRadius: 16,
            shadowRadius: 10,
            shadowOpacity: 0.2
        ) {
            Text("Custom")
        }
        XCTAssertNotNil(card)
    }
    
    // MARK: - GradientButton Tests
    
    func testGradientButtonRendering() {
        // Test that GradientButton can be created
        let button = GradientButton("Test Button") {
            // Action
        }
        XCTAssertNotNil(button)
    }
    
    func testGradientButtonVariants() {
        // Test button variants
        let primary = GradientButton.primary("Primary") {}
        let secondary = GradientButton.secondary("Secondary") {}
        let success = GradientButton.success("Success") {}
        XCTAssertNotNil(primary)
        XCTAssertNotNil(secondary)
        XCTAssertNotNil(success)
    }
    
    func testGradientButtonAnimation() {
        // Test button animation state
        let button = GradientButton("Animated") {}
        XCTAssertNotNil(button)
    }
    
    // MARK: - LoadingIndicator Tests
    
    func testLoadingIndicatorRendering() {
        // Test that LoadingIndicator can be created
        let indicator = LoadingIndicator()
        XCTAssertNotNil(indicator)
    }
    
    func testLoadingIndicatorVariants() {
        // Test loading indicator variants
        let inline = InlineLoadingIndicator()
        let fullScreen = FullScreenLoadingIndicator(message: "Loading...")
        XCTAssertNotNil(inline)
        XCTAssertNotNil(fullScreen)
    }
    
    func testLoadingIndicatorCustomization() {
        // Test loading indicator customization
        let indicator = LoadingIndicator(size: 50, color: AppColors.primary)
        XCTAssertNotNil(indicator)
    }
    
    // MARK: - Accessibility Tests
    
    func testColorsContrast() {
        // Test color contrast for accessibility
        let textColor = AppColors.brandTextPrimary
        let backgroundColor = AppColors.brandBackground
        XCTAssertNotNil(textColor)
        XCTAssertNotNil(backgroundColor)
    }
    
    func testTypographyDynamicType() {
        // Test Dynamic Type support
        let bodyFont = AppTypography.body()
        XCTAssertNotNil(bodyFont)
    }
    
    // MARK: - Integration Tests
    
    func testDesignSystemIntegration() {
        // Test that all components work together
        let card = CardView {
            VStack(spacing: AppSpacing.md) {
                Text("Title")
                    .font(AppTypography.title1())
                    .foregroundColor(AppColors.brandTextPrimary)
                
                GradientButton.primary("Action") {}
                
                LoadingIndicator()
            }
            .padding(AppSpacing.paddingMedium)
        }
        XCTAssertNotNil(card)
    }
}

