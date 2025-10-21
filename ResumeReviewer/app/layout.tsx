import './globals.css'

export const metadata = {
  title: 'AI Resume Reviewer',
  description: 'Get instant, detailed feedback on your resume with our advanced AI analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
