import Capacitor
import UIKit
import Vision

@objc(SubjectCutoutPlugin)
public class SubjectCutoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubjectCutoutPlugin"
    public let jsName = "SubjectCutout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "createCutout", returnType: CAPPluginReturnPromise)
    ]

    @objc func createCutout(_ call: CAPPluginCall) {
        guard #available(iOS 17.0, *) else {
            call.reject("Subject cutout requires iOS 17 or later")
            return
        }
        guard let value = call.getString("imageData"),
              let comma = value.firstIndex(of: ","),
              let data = Data(base64Encoded: String(value[value.index(after: comma)...])),
              let image = UIImage(data: data),
              let cgImage = image.cgImage else {
            call.reject("Invalid image data")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let request = VNGenerateForegroundInstanceMaskRequest()
                let handler = VNImageRequestHandler(cgImage: cgImage)
                try handler.perform([request])
                guard let result = request.results?.first else {
                    call.reject("No foreground subject found")
                    return
                }
                let mask = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
                let output = CIImage(cvPixelBuffer: mask)
                let original = CIImage(cgImage: cgImage)
                let clear = CIImage(color: .clear).cropped(to: original.extent)
                let composited = original.applyingFilter("CIBlendWithMask", parameters: [
                    kCIInputBackgroundImageKey: clear,
                    kCIInputMaskImageKey: output
                ])
                let context = CIContext()
                guard let rendered = context.createCGImage(composited, from: original.extent),
                      let png = UIImage(cgImage: rendered).pngData() else {
                    call.reject("Unable to render cutout")
                    return
                }
                call.resolve(["imageData": "data:image/png;base64,\(png.base64EncodedString())"])
            } catch {
                call.reject("Unable to create subject cutout", nil, error)
            }
        }
    }
}
