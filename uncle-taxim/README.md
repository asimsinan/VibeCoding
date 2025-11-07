# UncleTaxim 🚕

A modern, AI-powered ride-sharing application built with SwiftUI for iOS. UncleTaxim combines voice commands, intelligent chat support, and comprehensive ride management to deliver a seamless transportation experience.

## 📱 Overview

UncleTaxim is a full-featured ride-sharing platform that allows users to book rides using natural language voice commands, interact with an AI-powered chat assistant, and manage their transportation needs through an intuitive interface. The app supports both passengers and drivers, with real-time tracking, multi-stop routes, and comprehensive trip management.

## ✨ Key Features

### 🎤 Voice Booking
- **Natural Language Processing**: Book rides using voice commands in Turkish or English
- **Multi-stop Routes**: Plan routes with intermediate waypoints (e.g., "I want to go from Ankara to Istanbul via Eskişehir")
- **Current Location Detection**: Automatically uses GPS location when pickup is not specified
- **Real-time Transcription**: See your voice input transcribed in real-time
- **Smart Address Recognition**: AI extracts pickup, dropoff, and waypoint locations from natural speech
- **Instant Booking**: Book rides directly from voice commands

### 💬 AI Chat Support (RAG-Powered)
- **Intelligent Conversations**: Chat with an AI assistant powered by GPT-4.1
- **Retrieval-Augmented Generation (RAG)**: AI has access to your ride history, transactions, and trip summaries
- **Context-Aware Responses**: AI remembers previous conversations and provides personalized assistance
- **Ride Booking via Chat**: Book rides directly through chat conversations
- **CO2 Emissions Information**: Query your carbon footprint from completed rides
- **Ride History Queries**: Ask about your past rides, transactions, and trip details
- **Natural Language Understanding**: Ask questions in natural language (e.g., "Show my last ride", "What's my CO2 footprint?")

### 🗺️ Ride Suggestions
- **Smart Suggestions**: View and manage ride suggestions created via chat or voice
- **Detailed Ride Cards**: Beautiful cards showing route, price, distance, and duration
- **Interactive Maps**: Full map view with route visualization including waypoints
- **Expiration Management**: Suggestions expire after 1 hour with visual warnings
- **One-Tap Booking**: Book suggestions directly from the list or detail view

### 🚗 Ride Management
- **Real-time Tracking**: Track your active ride with live map updates
- **Multi-stop Routes**: Support for intermediate waypoints between pickup and dropoff
- **Driver Information**: View driver details including name, rating, vehicle info, and total rides
- **Ride Status Updates**: Real-time status updates (Pending → Accepted → In Progress → Completed)
- **Route Visualization**: Interactive maps showing the complete route with all stops
- **Distance & Time Estimates**: Accurate calculations including waypoint distances
- **Price Breakdown**: Transparent pricing with waypoint fees

### 👨‍✈️ Driver Dashboard
- **Available Rides**: View and accept pending ride requests
- **Active Ride Management**: Start, track, and complete rides
- **Ride Details**: Comprehensive ride information including pickup, dropoff, waypoints, and passenger details
- **Payment Processing**: Integrated Stripe payment processing for ride completion
- **Real-time Updates**: Live updates when rides are accepted or status changes
- **Driver Profile**: Manage driver information, vehicle details, and availability

### 💳 Payment System
- **Stripe Integration**: Secure payment processing via Stripe
- **Multiple Payment Methods**: Support for credit cards, debit cards, Apple Pay, and Google Pay
- **Payment History**: Complete transaction history with status tracking
- **Automatic Payment**: Default payment method used for ride bookings
- **Payment Verification**: Secure payment confirmation before ride completion

### 📍 Location Services
- **GPS Integration**: Automatic current location detection
- **Address Geocoding**: Convert addresses to coordinates and vice versa
- **MapKit Integration**: Native iOS maps with route calculation
- **Multi-stop Routing**: Sequential route calculation for routes with waypoints
- **Distance & Duration**: Accurate calculations for complex routes
- **Saved Addresses**: Save frequently used addresses for quick access

### 📊 Trip Summaries
- **Complete Trip Details**: Full trip information after ride completion
- **CO2 Emissions Tracking**: Calculate and display carbon footprint for each trip
- **Route Visualization**: View the complete route taken during the trip
- **Driver & Passenger Ratings**: Rate your experience after each trip
- **Trip History**: Access all completed trips with detailed information
- **Receipt Generation**: Detailed trip receipts with all charges

### 👤 Profile Management
- **User Profile**: Manage personal information and preferences
- **Saved Addresses**: Save and manage frequently used pickup/dropoff locations
- **Payment Methods**: Add, edit, and manage payment methods
- **Ride History**: View complete history of all rides with filters
- **Transaction History**: Track all payments and transactions
- **Settings**: App preferences and account settings

### 🎨 User Experience
- **Modern UI Design**: Beautiful, intuitive interface with custom design system
- **Dark Mode Support**: Full support for iOS dark mode
- **Video Splash Screen**: Custom animated splash screen
- **Haptic Feedback**: Tactile feedback for better user interaction
- **Loading States**: Skeleton views and loading indicators
- **Error Handling**: User-friendly error messages and recovery
- **Offline Support**: Works offline with data synchronization when online

### 🔄 Real-time Features
- **Live Ride Updates**: Real-time status updates using Firestore listeners
- **Driver Assignment**: Instant notifications when a driver accepts your ride
- **Status Synchronization**: Automatic sync across all devices
- **Chat Updates**: Real-time chat message delivery

### 🌍 Multi-language Support
- **Turkish & English**: Support for both Turkish and English voice commands
- **Natural Language**: Understands natural language in both languages
- **Waypoint Detection**: Detects waypoints in Turkish phrases (e.g., "üzerinden", "via")

### 📈 Pricing & Calculations
- **Dynamic Pricing**: Realistic Turkish Lira pricing model
- **Base Fare**: Starting fare for all rides
- **Distance-based**: Per-kilometer charges
- **Time-based**: Per-minute charges
- **Waypoint Fees**: Additional fee per intermediate stop
- **Ride Type Multipliers**: Different pricing for standard, premium, and shared rides
- **Minimum Fare**: Ensures fair pricing for short trips

### 🔐 Security & Authentication
- **Firebase Authentication**: Secure user authentication
- **User & Driver Roles**: Separate authentication for passengers and drivers
- **Data Privacy**: Secure data handling and storage
- **Authorization**: Role-based access control

### 📱 Technical Features
- **SwiftUI**: Modern declarative UI framework
- **Firebase Backend**: Firestore database with real-time sync
- **MapKit**: Native iOS mapping and routing
- **AVFoundation**: Voice recording and processing
- **Combine Framework**: Reactive programming for data flow
- **MVVM Architecture**: Clean architecture pattern
- **Offline Queue**: Queue operations when offline, sync when online

## 🏗️ Architecture

### Tech Stack
- **Frontend**: SwiftUI, Swift 5.9+
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Maps**: MapKit
- **Payments**: Stripe
- **AI**: OpenAI GPT-4.1 via Vercel AI Gateway
- **Voice**: AVFoundation Speech Recognition

### Project Structure
```
UncleTaxim/
├── Core/
│   ├── Models/          # Data models (Ride, Driver, Transaction, etc.)
│   ├── Services/        # Business logic services
│   ├── Utilities/       # Helper functions and extensions
│   └── DesignSystem/    # UI components and styling
├── Features/
│   ├── Views/           # SwiftUI views organized by feature
│   └── ViewModels/      # ViewModels for each feature
└── UncleTaxim/          # App entry point and configuration
```

## 🚀 Getting Started

### Prerequisites
- Xcode 15.0 or later
- iOS 16.0 or later
- CocoaPods (for dependencies)
- Firebase project configured
- Stripe account (for payments)

### Installation
1. Clone the repository
2. Install dependencies: `pod install`
3. Configure Firebase:
   - Add `GoogleService-Info.plist` to the project
   - Configure Firestore rules
   - Set up Cloud Functions for Stripe
4. Configure Stripe:
   - Add Stripe keys to Cloud Functions
   - Set up webhook endpoints
5. Build and run in Xcode

## 📝 Key Models

### Ride
- Multi-stop route support (waypoints)
- Real-time status tracking
- Driver assignment with cached driver name
- Estimated and actual pricing, distance, duration
- Payment method integration

### TripSummary
- Complete trip details
- CO2 emissions calculation
- Route visualization
- Ratings and feedback

### Driver
- Profile information
- Vehicle details
- Availability status
- Rating and ride count

## 🎯 Use Cases

1. **Book a Ride**: Use voice commands or chat to book a ride with multiple stops
2. **Track Active Ride**: Monitor your ride in real-time with map updates
3. **View History**: Check past rides, transactions, and CO2 emissions
4. **Manage Profile**: Update payment methods, saved addresses, and preferences
5. **Driver Operations**: Accept rides, start trips, complete and process payments

## 🔮 Future Enhancements

- Push notifications
- Ride sharing options
- Scheduled rides
- Advanced route optimization
- Social features
- Loyalty program

## 📄 License

[Add your license information here]

## 👥 Contributors

[Add contributor information here]

---

**Built with ❤️ using SwiftUI and Firebase**

