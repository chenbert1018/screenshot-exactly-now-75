import Capacitor
import StoreKit

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
        guard #available(iOS 15.0, *) else {
            call.reject("IdolDays+ requires iOS 15 or later")
            return
        }
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product is not available in the App Store")
                    return
                }
                call.resolve([
                    "productId": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "displayPrice": product.displayPrice
                ])
            } catch {
                call.reject("Unable to load product", nil, error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("IdolDays+ requires iOS 15 or later")
            return
        }
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product is not available in the App Store")
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    let transaction = try self.verified(verification)
                    await transaction.finish()
                    call.resolve(self.entitlementPayload(transaction: transaction))
                case .pending:
                    call.resolve(["status": "pending", "active": false])
                case .userCancelled:
                    call.resolve(["status": "cancelled", "active": false])
                @unknown default:
                    call.reject("Unknown App Store purchase result")
                }
            } catch {
                call.reject("Unable to complete purchase", nil, error)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("IdolDays+ requires iOS 15 or later")
            return
        }
        Task { @MainActor in
            do {
                try await AppStore.sync()
                call.resolve(await self.currentEntitlement(productId: call.getString("productId") ?? ""))
            } catch {
                call.reject("Unable to restore purchases", nil, error)
            }
        }
    }

    @objc func entitlement(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("IdolDays+ requires iOS 15 or later")
            return
        }
        Task { @MainActor in
            call.resolve(await self.currentEntitlement(productId: call.getString("productId") ?? ""))
        }
    }

    @available(iOS 15.0, *)
    private func currentEntitlement(productId: String) async -> [String: Any] {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  transaction.productID == productId,
                  transaction.revocationDate == nil else { continue }
            return entitlementPayload(transaction: transaction)
        }
        return ["active": false]
    }

    @available(iOS 15.0, *)
    private func verified<T>(_ result: VerificationResult<T>) throws -> T {
        guard case .verified(let value) = result else {
            throw NSError(
                domain: "IdolDaysStoreKit",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Unverified App Store transaction"]
            )
        }
        return value
    }

    @available(iOS 15.0, *)
    private func entitlementPayload(transaction: Transaction) -> [String: Any] {
        var payload: [String: Any] = [
            "status": "purchased",
            "active": transaction.revocationDate == nil,
            "productId": transaction.productID
        ]
        if let expirationDate = transaction.expirationDate {
            payload["expirationDate"] = ISO8601DateFormatter().string(from: expirationDate)
            payload["active"] = expirationDate > Date() && transaction.revocationDate == nil
        }
        return payload
    }
}
