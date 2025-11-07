import SwiftUI

struct SavedAddressQuickButton: View {
    let address: SavedAddress
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: AppSpacing.xs) {
                Image(systemName: address.isDefault ? "house.fill" : "mappin.circle.fill")
                    .font(.system(size: 14))
                    .foregroundColor(address.isDefault ? AppColors.accentPurple : AppColors.accentBlue)
                
                Text(address.name)
                    .font(AppTypography.caption1(.semibold))
                    .foregroundColor(AppColors.brandTextPrimary)
            }
            .padding(.horizontal, AppSpacing.md)
            .padding(.vertical, AppSpacing.sm)
            .background(AppColors.brandSurface)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(address.isDefault ? AppColors.accentPurple.opacity(0.5) : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }
}

