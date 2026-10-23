package in.pandeytechno.petpyaar;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/** फ़ोन में मौजूद UPI ऐप (Google Pay, PhonePe, Paytm, BHIM…) की सूची और उनसे भुगतान खोलना */
@CapacitorPlugin(name = "UpiPay")
public class UpiPlugin extends Plugin {

    @PluginMethod
    public void apps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay?pa=test@upi&pn=Test&am=1&cu=INR"));
        List<ResolveInfo> list = pm.queryIntentActivities(probe, 0);
        JSArray arr = new JSArray();
        java.util.HashSet<String> seen = new java.util.HashSet<>();
        for (ResolveInfo ri : list) {
            String pkg = ri.activityInfo.packageName;
            if (seen.contains(pkg)) continue;
            seen.add(pkg);
            JSObject o = new JSObject();
            o.put("package", pkg);
            o.put("label", String.valueOf(ri.loadLabel(pm)));
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("apps", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void pay(PluginCall call) {
        String url = call.getString("url");
        String pkg = call.getString("package");
        if (url == null) { call.reject("url missing"); return; }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (pkg != null && !pkg.isEmpty()) {
                intent.setPackage(pkg);
                getActivity().startActivity(intent);
            } else {
                Intent chooser = Intent.createChooser(intent, "UPI ऐप चुनें / Choose UPI app");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(chooser);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("No UPI app", e);
        }
    }
}
