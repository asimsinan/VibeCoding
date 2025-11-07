import SwiftUI

struct ChatMessageView: View {
    let message: ChatMessage
    
    var isUser: Bool {
        message.sender == .user
    }
    
    var body: some View {
        HStack(alignment: .bottom, spacing: AppSpacing.sm) {
            if isUser {
                Spacer(minLength: 60)
            } else {
                // AI Avatar
                Circle()
                    .fill(AppColors.gradientAccent)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: "sparkles")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    )
            }
            
            VStack(alignment: isUser ? .trailing : .leading, spacing: AppSpacing.xs) {
                // Message Bubble
                Text(message.message)
                    .font(AppTypography.body(.regular))
                    .foregroundColor(isUser ? .white : AppColors.brandTextPrimary)
                    .padding(.horizontal, AppSpacing.md)
                    .padding(.vertical, AppSpacing.sm)
                    .background(
                        Group {
                            if isUser {
                                AppColors.gradientAccent
                            } else {
                                AppColors.brandSurface
                            }
                        }
                    )
                    .cornerRadius(20)
                    .shadow(
                        color: isUser ? AppColors.accentBlue.opacity(0.2) : AppColors.shadowLight,
                        radius: 8,
                        x: 0,
                        y: 2
                    )
                
                // Timestamp
                Text(formatTimestamp(message.timestamp))
                    .font(AppTypography.caption2())
                    .foregroundColor(AppColors.brandTextSecondary)
                    .padding(.horizontal, AppSpacing.sm)
            }
            .frame(maxWidth: UIScreen.main.bounds.width * 0.75, alignment: isUser ? .trailing : .leading)
            
            if !isUser {
                Spacer(minLength: 60)
            }
        }
        .padding(.horizontal, AppSpacing.md)
        .padding(.vertical, AppSpacing.xs)
    }
    
    private func formatTimestamp(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}


