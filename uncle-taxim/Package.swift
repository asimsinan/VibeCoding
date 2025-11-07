// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "UncleTaxim",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "UncleTaxim",
            targets: ["UncleTaxim"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.0.0"),
    ],
    targets: [
        .target(
            name: "UncleTaxim",
            dependencies: [
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
            ],
            path: ".",
            exclude: [
                "Tests",
                "UncleTaxim.xcodeproj",
                "Database",
                "Contracts",
                "UncleTaxim",
                "scripts",
                "Config/GoogleService-Info.plist",
                "Config/GoogleService-Info-Dev.plist",
                "Config/GoogleService-Info-Prod.plist",
                "Config/GoogleService-Info-Test.plist"
            ],
            sources: [
                "Core",
                "Features",
                "Config"
            ]
        ),
        .testTarget(
            name: "UncleTaximTests",
            dependencies: ["UncleTaxim"],
            path: "Tests"
        ),
    ]
)
