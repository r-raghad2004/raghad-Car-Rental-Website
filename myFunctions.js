/* ===== myFunctions.js : ملف الجافاسكريبت الوحيد للموقع ===== */

/* ---------- بيانات السيارات (الرمز => الموديل والسعر اليومي) ---------- */
var carsData = {
    "CR-001": { model: "Toyota Corolla", price: 250000 },
    "CR-002": { model: "Kia Sportage", price: 400000 },
    "CR-003": { model: "Hyundai Elantra", price: 300000 },
    "CR-004": { model: "Chevrolet Spark", price: 180000 },
    "CR-005": { model: "Hyundai Tucson", price: 450000 },
    "CR-006": { model: "Renault Duster", price: 350000 }
};

var MS_PER_DAY = 24 * 60 * 60 * 1000;
var DISCOUNT_LIMIT_DAYS = 10;
var DISCOUNT_RATE = 0.05;

/* ---------- تعابير التحقق ---------- */
var nameRegex = /^[ء-ي]+(\s+[ء-ي]+)*$/;      // حروف عربية فقط (مع مسافات بين الكلمات)
var nationalIdRegex = /^(0[1-9]|1[0-4])[0-9]{9}$/;               // 11 خانة، أول خانتين 01-14
var mobileRegex = /^09(3|4|5|6|8|9)[0-9]{7}$/;                   // Syriatel: 093 098 099 | MTN: 094 095 096
var emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
var dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;                     // yyyy-mm-dd

/* ---------- دوال مساعدة ---------- */

/* تحويل نص بصيغة yyyy-mm-dd إلى تاريخ، أو null إذا كان غير صالح (يتحقق من وجود اليوم فعلاً) */
function parseDate(text) {
    var m = dateRegex.exec(text);
    if (m === null) {
        return null;
    }
    var y = parseInt(m[1], 10);
    var mo = parseInt(m[2], 10);
    var d = parseInt(m[3], 10);
    var date = new Date(Date.UTC(y, mo - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
        return null;
    }
    return date;
}

function daysBetween(startDate, endDate) {
    return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
}

function formatMoney(value) {
    var s = String(Math.round(value));
    var out = "";
    var count = 0;
    for (var i = s.length - 1; i >= 0; i--) {
        out = s.charAt(i) + out;
        count++;
        if (count % 3 === 0 && i > 0) {
            out = "," + out;
        }
    }
    return out + " ل.س";
}

/* عرض / إخفاء رسالة خطأ لحقل معيّن */
function setError(fieldId, message) {
    var $field = $("#" + fieldId);
    var $msg = $("#err-" + fieldId);
    if (message === "") {
        $field.removeClass("invalid");
        $msg.text("");
    } else {
        $field.addClass("invalid");
        $msg.text(message);
    }
}

/* ---------- دوال التحقق من كل حقل (ترجع true عند النجاح) ---------- */

function validateName() {
    var v = $.trim($("#fullname").val());
    if (v !== "" && !nameRegex.test(v)) {
        setError("fullname", "الاسم يجب أن يحتوي أحرفاً عربية فقط.");
        return false;
    }
    setError("fullname", "");
    return true;
}

function validateNationalId() {
    var v = $.trim($("#nationalid").val());
    if (v === "") {
        setError("nationalid", "الرقم الوطني إلزامي.");
        return false;
    }
    if (!/^[0-9]{11}$/.test(v)) {
        setError("nationalid", "الرقم الوطني يجب أن يتكون من 11 رقماً.");
        return false;
    }
    if (!nationalIdRegex.test(v)) {
        setError("nationalid", "أول خانتين يجب أن تكونا رمز المحافظة (من 01 إلى 14).");
        return false;
    }
    setError("nationalid", "");
    return true;
}

function validateMobile() {
    var v = $.trim($("#mobile").val());
    if (v !== "" && !mobileRegex.test(v)) {
        setError("mobile", "رقم غير مطابق لشبكتي Syriatel (093، 098، 099) أو MTN (094، 095، 096).");
        return false;
    }
    setError("mobile", "");
    return true;
}

function validateEmail() {
    var v = $.trim($("#email").val());
    if (v !== "" && !emailRegex.test(v)) {
        setError("email", "البريد الإلكتروني غير صحيح.");
        return false;
    }
    setError("email", "");
    return true;
}

function validateDates() {
    var startText = $.trim($("#startdate").val());
    var endText = $.trim($("#enddate").val());
    var ok = true;
    var start = null;
    var end = null;

    if (startText === "") {
        setError("startdate", "تاريخ البداية إلزامي.");
        ok = false;
    } else {
        start = parseDate(startText);
        if (start === null) {
            setError("startdate", "الصيغة المطلوبة yyyy-mm-dd وبتاريخ صحيح.");
            ok = false;
        } else {
            setError("startdate", "");
        }
    }

    if (endText === "") {
        setError("enddate", "تاريخ النهاية إلزامي.");
        ok = false;
    } else {
        end = parseDate(endText);
        if (end === null) {
            setError("enddate", "الصيغة المطلوبة yyyy-mm-dd وبتاريخ صحيح.");
            ok = false;
        } else {
            setError("enddate", "");
        }
    }

    if (ok && start !== null && end !== null && end.getTime() <= start.getTime()) {
        setError("enddate", "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية.");
        ok = false;
    }
    return ok;
}

/* ---------- السيارات المختارة ---------- */
function getSelectedCars() {
    var list = [];
    $("input[name='pick']:checked").each(function () {
        list.push($(this).val());
    });
    return list;
}

/* ---------- حساب وعرض النتيجة ---------- */
function showResult() {
    var selected = getSelectedCars();
    var start = parseDate($.trim($("#startdate").val()));
    var end = parseDate($.trim($("#enddate").val()));
    var days = daysBetween(start, end);

    var $tbody = $("#result-rows");
    $tbody.empty();
    var total = 0;

    for (var i = 0; i < selected.length; i++) {
        var code = selected[i];
        var car = carsData[code];
        var cost = car.price * days;
        total += cost;
        var $tr = $("<tr></tr>");
        $tr.append($("<td></td>").text(car.model + " (" + code + ")"));
        $tr.append($("<td></td>").text(days));
        $tr.append($("<td></td>").text(formatMoney(cost)));
        $tbody.append($tr);
    }

    var discount = 0;
    if (days > DISCOUNT_LIMIT_DAYS) {
        discount = total * DISCOUNT_RATE;
    }
    var finalAmount = total - discount;

    $("#res-name").text($.trim($("#fullname").val()) === "" ? "—" : $.trim($("#fullname").val()));
    $("#res-days").text(days);
    $("#res-sum").text(formatMoney(total));
    $("#res-discount").text(formatMoney(discount));
    $("#res-final").text(formatMoney(finalAmount));

    if (discount > 0) {
        $("#res-note").text("تم تطبيق خصم 5% لأن مدة التأجير تجاوزت 10 أيام.").show();
    } else {
        $("#res-note").hide();
    }
    $("#overlay").fadeIn(300);
}

/* ---------- التحقق الكامل عند الإرسال ---------- */
function validateForm() {
    var selected = getSelectedCars();
    if (selected.length === 0) {
        $("#err-cars").text("اختر سيارة واحدة على الأقل من الجدول.");
        return false;
    }
    $("#err-cars").text("");

    // نُنفّذ كل التحققات حتى تظهر كل الأخطاء معاً
    var okName = validateName();
    var okId = validateNationalId();
    var okDates = validateDates();
    var okMobile = validateMobile();
    var okEmail = validateEmail();
    return okName && okId && okDates && okMobile && okEmail;
}

/* ---------- الخروج من الموقع ---------- */
function exitSite() {
    if (confirm("هل تريد الخروج من الموقع؟")) {
        window.location.href = "about:blank";
    }
    return false;
}

/* ===================== jQuery ===================== */
$(document).ready(function () {

    /* ظهور تدريجي للمحتوى في كل الصفحات */
    $("#content").hide().fadeIn(500);

    /* تمييز الصفحة الحالية في القائمة */
    var page = window.location.pathname.split("/").pop().toLowerCase();
    $("#nav a").each(function () {
        var href = $(this).attr("href");
        if (href && href.toLowerCase() === page) {
            $(this).addClass("active");
        }
    });

    /* زر الخروج */
    $("#nav a.exit").click(function (e) {
        e.preventDefault();
        exitSite();
    });

    /* ---- صفحة السيارات: إظهار/إخفاء التفاصيل (عدة سيارات معاً) ---- */
    $("input[name='details']").click(function () {
        var code = $(this).val();
        var $row = $("#details-" + code);
        if ($(this).is(":checked")) {
            $row.fadeIn(300);
        } else {
            $row.fadeOut(300);
        }
    });

    /* ---- زر متابعة: إظهار النموذج في نفس الصفحة ---- */
    $("#btn-continue").click(function () {
        if (getSelectedCars().length === 0) {
            $("#err-cars").text("اختر سيارة واحدة على الأقل من الجدول.");
            return;
        }
        $("#err-cars").text("");

        var names = [];
        $.each(getSelectedCars(), function (i, code) {
            names.push(carsData[code].model);
        });
        $("#chosen-list").text(names.join("، "));

        $("#booking-section").slideDown(400, function () {
            $("#fullname").focus();
        });
    });

    /* ---- تحقق فوري عند مغادرة الحقل ---- */
    $("#fullname").blur(validateName);
    $("#nationalid").blur(validateNationalId);
    $("#mobile").blur(validateMobile);
    $("#email").blur(validateEmail);
    $("#startdate, #enddate").blur(validateDates);

    /* ---- إرسال النموذج ---- */
    $("#booking-form").submit(function (e) {
        e.preventDefault();
        if (validateForm()) {
            showResult();
        }
    });

    /* ---- إغلاق نافذة النتيجة ---- */
    $("#btn-close").click(function () {
        $("#overlay").fadeOut(250);
    });
});
