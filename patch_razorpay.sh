#!/bin/bash
cd /Users/indusinnovate/Desktop/RealShare/android-app

FILE="node_modules/react-native-razorpay/ios/RazorpayCheckout.mm"
sed -i '' 's/NSString \*keyID = (NSString \*)\[options objectForKey:@"key"\];/NSString *keyID = (NSString *)[options objectForKey:@"key"];\n    if (!keyID || keyID.length == 0) {\n        dispatch_async(dispatch_get_main_queue(), ^{\n            [RazorpayEventEmitter onPaymentError:0 description:@"Invalid or missing Razorpay key." andData:nil];\n        });\n        return;\n    }/' $FILE

sed -i '' 's/UINavigationController \*rootViewController = ((UINavigationController\*) app.window.rootViewController);/UIViewController *rootViewController = app.window.rootViewController;\n        if (!rootViewController) {\n            for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {\n                if ([scene isKindOfClass:[UIWindowScene class]]) {\n                    UIWindowScene *windowScene = (UIWindowScene *)scene;\n                    if (windowScene.activationState == UISceneActivationStateForegroundActive) {\n                        rootViewController = windowScene.windows.firstObject.rootViewController;\n                        break;\n                    }\n                }\n            }\n        }/' $FILE

npx patch-package react-native-razorpay
