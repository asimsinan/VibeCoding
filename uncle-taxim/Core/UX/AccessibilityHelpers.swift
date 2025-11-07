import SwiftUI

/// Accessibility helpers for VoiceOver, Dynamic Type, and other features
struct AccessibilityHelpers {
    /// Minimum touch target size (WCAG 2.1 AA requirement)
    static let minimumTouchTarget: CGFloat = 44
    
    /// Check if Reduce Motion is enabled
    static var isReduceMotionEnabled: Bool {
        UIAccessibility.isReduceMotionEnabled
    }
    
    /// Check if VoiceOver is running
    static var isVoiceOverRunning: Bool {
        UIAccessibility.isVoiceOverRunning
    }
}

/// Accessibility modifier for views
struct AccessibilityModifier: ViewModifier {
    let label: String
    let hint: String?
    let value: String?
    let traits: AccessibilityTraits?
    
    init(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits? = nil
    ) {
        self.label = label
        self.hint = hint
        self.value = value
        self.traits = traits
    }
    
    func body(content: Content) -> some View {
        content
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityValue(value ?? "")
            .accessibilityAddTraits(traits ?? [])
    }
}

extension View {
    func accessibility(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits? = nil
    ) -> some View {
        modifier(AccessibilityModifier(
            label: label,
            hint: hint,
            value: value,
            traits: traits
        ))
    }
}

/// Dynamic Type support modifier
struct DynamicTypeModifier: ViewModifier {
    let textStyle: Font.TextStyle
    
    func body(content: Content) -> some View {
        content
            .font(.system(textStyle, design: .default))
            .dynamicTypeSize(...DynamicTypeSize.accessibility5)
    }
}

extension View {
    func dynamicType(_ textStyle: Font.TextStyle = .body) -> some View {
        modifier(DynamicTypeModifier(textStyle: textStyle))
    }
}

/// Reduce Motion modifier
struct ReduceMotionModifier: ViewModifier {
    let animation: Animation
    
    func body(content: Content) -> some View {
        content
            .animation(
                AccessibilityHelpers.isReduceMotionEnabled ? nil : animation,
                value: UUID()
            )
    }
}

extension View {
    func respectsReduceMotion(_ animation: Animation = .default) -> some View {
        modifier(ReduceMotionModifier(animation: animation))
    }
}

/// Color contrast checker for WCAG 2.1 AA compliance
struct ColorContrastHelper {
    /// Check if color contrast meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
    static func meetsWCAGAA(foreground: UIColor, background: UIColor, isLargeText: Bool = false) -> Bool {
        let ratio = calculateContrastRatio(foreground: foreground, background: background)
        let minimumRatio = isLargeText ? 3.0 : 4.5
        return ratio >= minimumRatio
    }
    
    private static func calculateContrastRatio(foreground: UIColor, background: UIColor) -> Double {
        let fgLuminance = relativeLuminance(foreground)
        let bgLuminance = relativeLuminance(background)
        
        let lighter = max(fgLuminance, bgLuminance)
        let darker = min(fgLuminance, bgLuminance)
        
        return (lighter + 0.05) / (darker + 0.05)
    }
    
    private static func relativeLuminance(_ color: UIColor) -> Double {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        
        color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
        
        let r = adjustComponent(red)
        let g = adjustComponent(green)
        let b = adjustComponent(blue)
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    
    private static func adjustComponent(_ component: CGFloat) -> Double {
        let c = Double(component)
        if c <= 0.03928 {
            return c / 12.92
        } else {
            return pow((c + 0.055) / 1.055, 2.4)
        }
    }
}

/// Voice Control support
struct VoiceControlModifier: ViewModifier {
    let identifier: String
    
    func body(content: Content) -> some View {
        content
            .accessibilityIdentifier(identifier)
    }
}

extension View {
    func voiceControlIdentifier(_ identifier: String) -> some View {
        modifier(VoiceControlModifier(identifier: identifier))
    }
}

