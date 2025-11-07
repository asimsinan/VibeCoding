import SwiftUI

/// SF Pro typography scale with Dynamic Type support
struct AppTypography {
    // MARK: - Font Sizes
    enum FontSize {
        case largeTitle
        case title1
        case title2
        case title3
        case headline
        case body
        case callout
        case subheadline
        case footnote
        case caption1
        case caption2
        
        // Computed property to get the actual font size
        var rawValue: CGFloat {
            switch self {
            case .largeTitle: return 34
            case .title1: return 28
            case .title2: return 22
            case .title3: return 20
            case .headline: return 17
            case .body: return 17
            case .callout: return 16
            case .subheadline: return 15
            case .footnote: return 13
            case .caption1: return 12
            case .caption2: return 11
            }
        }
    }
    
    // MARK: - Font Weights
    enum FontWeight {
        case ultraLight, thin, light, regular, medium, semibold, bold, heavy, black
        
        var value: Font.Weight {
            switch self {
            case .ultraLight: return .ultraLight
            case .thin: return .thin
            case .light: return .light
            case .regular: return .regular
            case .medium: return .medium
            case .semibold: return .semibold
            case .bold: return .bold
            case .heavy: return .heavy
            case .black: return .black
            }
        }
    }
    
    // MARK: - Typography Styles
    static func largeTitle(_ weight: FontWeight = .bold) -> Font {
        return .system(size: FontSize.largeTitle.rawValue, weight: weight.value, design: .default)
    }
    
    static func title1(_ weight: FontWeight = .bold) -> Font {
        return .system(size: FontSize.title1.rawValue, weight: weight.value, design: .default)
    }
    
    static func title2(_ weight: FontWeight = .semibold) -> Font {
        return .system(size: FontSize.title2.rawValue, weight: weight.value, design: .default)
    }
    
    static func title3(_ weight: FontWeight = .semibold) -> Font {
        return .system(size: FontSize.title3.rawValue, weight: weight.value, design: .default)
    }
    
    static func headline(_ weight: FontWeight = .semibold) -> Font {
        return .system(size: FontSize.headline.rawValue, weight: weight.value, design: .default)
    }
    
    static func body(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.body.rawValue, weight: weight.value, design: .default)
    }
    
    static func callout(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.callout.rawValue, weight: weight.value, design: .default)
    }
    
    static func subheadline(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.subheadline.rawValue, weight: weight.value, design: .default)
    }
    
    static func footnote(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.footnote.rawValue, weight: weight.value, design: .default)
    }
    
    static func caption1(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.caption1.rawValue, weight: weight.value, design: .default)
    }
    
    static func caption2(_ weight: FontWeight = .regular) -> Font {
        return .system(size: FontSize.caption2.rawValue, weight: weight.value, design: .default)
    }
}

// MARK: - Dynamic Type Support Extension
import UIKit

