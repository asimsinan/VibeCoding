import SwiftUI

struct LocationRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let address: String
    
    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(iconColor)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTypography.caption1(.medium))
                    .foregroundColor(AppColors.brandTextSecondary)
                
                Text(address)
                    .font(AppTypography.body())
                    .foregroundColor(AppColors.brandTextPrimary)
                    .lineLimit(2)
            }
            
            Spacer()
        }
    }
}

