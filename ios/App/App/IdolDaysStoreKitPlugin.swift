import Foundation
import Capacitor
import StoreKit

@available(iOS 15.0, *)
@objc(IdolDaysStoreKitPlugin)
public class IdolDaysStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "IdolDaysStoreKitPlugin"
    public let jsName = "IdolDaysStoreKit"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "product", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "entitlement", returnType: CAPPluginReturnPromise)
    ]

    @objc func product(_ call: CAPPluginCall) {
        guard let productId = productID(from: call) else {
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])

                guard let product = products.first else {
                    call.reject("IdolDays+ product not found")
                    return
                }

                call.resolve([
                    "productId": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "displayPrice": product.displayPrice
                ])
            } catch {
                call.reject(
                    "Unable to load IdolDays+ product",
                    nil,
                    error
                )
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = productID(from: call) else {
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])

                guard let product = products.first else {
                    call.reject("IdolDays+ product not found")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    let transaction = try verified(verification)

                    let active = isActive(transaction)

                    await transaction.finish()

                    call.resolve([
                        "status": "purchased",
                        "active": active,
                        "productId": transaction.productID,
                        "expirationDate": isoDate(transaction.expirationDate)
                    ])

                case .pending:
                    call.resolve([
                        "status": "pending",
                        "active": false
                    ])

                case .userCancelled:
                    call.resolve([
                        "status": "cancelled",
                        "active": false
                    ])

                @unknown default:
                    call.reject("Unknown App Store purchase result")
                }
            } catch {
                call.reject(
                    "Unable to purchase IdolDays+",
                    nil,
                    error
                )
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard let productId = productID(from: call) else {
            return
        }

        Task {
            do {
                try await AppStore.sync()
                let result = await currentEntitlement(for: productId)
                call.resolve(result)
            } catch {
                call.reject(
                    "Unable to restore IdolDays+",
                    nil,
                    error
                )
            }
        }
    }

    @objc func entitlement(_ call: CAPPluginCall) {
        guard let productId = productID(from: call) else {
            return
        }

        Task {
            let result = await currentEntitlement(for: productId)
            call.resolve(result)
        }
    }

    private func productID(from call: CAPPluginCall) -> String? {
        guard
            let productId = call.getString("productId"),
            !productId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            call.reject("productId is required")
            return nil
        }

        return productId
    }

    private func currentEntitlement(
        for productId: String
    ) async -> [String: Any] {

        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else {
                continue
            }

            guard transaction.productID == productId else {
                continue
            }

            guard isActive(transaction) else {
                continue
            }

            return [
                "active": true,
                "productId": transaction.productID,
                "expirationDate": isoDate(transaction.expirationDate)
            ]
        }

        return [
            "active": false
        ]
    }

    private func isActive(_ transaction: Transaction) -> Bool {
        if transaction.revocationDate != nil {
            return false
        }

        if let expirationDate = transaction.expirationDate,
           expirationDate <= Date() {
            return false
        }

        return true
    }

    private func verified<T>(
        _ result: VerificationResult<T>
    ) throws -> T {

        switch result {
        case .verified(let safe):
            return safe

        case .unverified(_, let error):
            throw error
        }
    }

    private func isoDate(_ date: Date?) -> String {
        guard let date else {
            return ""
        }

        return ISO8601DateFormatter().string(from: date)
    }
}
