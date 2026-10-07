.pragma library

/*
 * Vietnamese lunar calendar algorithms.
 * Based on the JavaScript implementation by Ho Ngoc Duc
 */

var PI = Math.PI;

function INT(d) {
    return Math.floor(d);
}

function jdFromDate(dd, mm, yy) {
    var a = INT((14 - mm) / 12);
    var y = yy + 4800 - a;
    var m = mm + 12 * a - 3;
    var jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) {
        jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    }
    return jd;
}

function newMoon(k) {
    var T = k / 1236.85;
    var T2 = T * T;
    var T3 = T2 * T;
    var dr = PI / 180;
    var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    var deltat;
    if (T < -11) {
        deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    } else {
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    return Jd1 + C1 - deltat;
}

function sunLongitude(jdn) {
    var T = (jdn - 2451545.0) / 36525;
    var T2 = T * T;
    var dr = PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    var L = (L0 + DL) * dr;
    L = L - PI * 2 * INT(L / (PI * 2));
    return L;
}

function getSunLongitude(dayNumber, timeZone) {
    return INT(sunLongitude(dayNumber - 0.5 - timeZone / 24.0) / PI * 6);
}

function getNewMoonDay(k, timeZone) {
    return INT(newMoon(k) + 0.5 + timeZone / 24.0);
}

function getLunarMonth11(yy, timeZone) {
    var off = jdFromDate(31, 12, yy) - 2415021;
    var k = INT(off / 29.530588853);
    var nm = getNewMoonDay(k, timeZone);
    var sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
        nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
}

function getLeapMonthOffset(a11, timeZone) {
    var k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    var last = 0;
    var i = 1;
    var arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
        last = arc;
        i++;
        arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
}

function convertSolar2Lunar(dd, mm, yy, timeZone) {
    if (timeZone === undefined) {
        timeZone = 7;
    }
    var dayNumber = jdFromDate(dd, mm, yy);
    var k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    var monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
        monthStart = getNewMoonDay(k, timeZone);
    }
    while (monthStart > dayNumber) {
        k--;
        monthStart = getNewMoonDay(k, timeZone);
    }
    var a11 = getLunarMonth11(yy, timeZone);
    var b11 = a11;
    var lunarYear;
    if (a11 >= monthStart) {
        lunarYear = yy;
        a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
        lunarYear = yy + 1;
        b11 = getLunarMonth11(yy + 1, timeZone);
    }
    var lunarDay = dayNumber - monthStart + 1;
    var diff = INT((monthStart - a11) / 29);
    var lunarLeap = 0;
    var lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
        var leapMonthDiff = getLeapMonthOffset(a11, timeZone);
        if (diff >= leapMonthDiff) {
            lunarMonth = diff + 10;
            if (diff === leapMonthDiff) {
                lunarLeap = 1;
            }
        }
    }
    if (lunarMonth > 12) {
        lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
        lunarYear -= 1;
    }
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

function jdToDate(jd) {
    var a, b, c;
    if (jd > 2299160) {
        a = jd + 32044;
        b = INT((4 * a + 3) / 146097);
        c = a - INT((b * 146097) / 4);
    } else {
        b = 0;
        c = jd + 32082;
    }
    var d = INT((4 * c + 3) / 1461);
    var e = c - INT((1461 * d) / 4);
    var m = INT((5 * e + 2) / 153);
    return {
        day: e - INT((153 * m + 2) / 5) + 1,
        month: m + 3 - 12 * INT(m / 10),
        year: b * 100 + d - 4800 + INT(m / 10)
    };
}

function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, timeZone) {
    if (timeZone === undefined) {
        timeZone = 7;
    }
    var a11, b11;
    if (lunarMonth < 11) {
        a11 = getLunarMonth11(lunarYear - 1, timeZone);
        b11 = getLunarMonth11(lunarYear, timeZone);
    } else {
        a11 = getLunarMonth11(lunarYear, timeZone);
        b11 = getLunarMonth11(lunarYear + 1, timeZone);
    }
    var k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    var off = lunarMonth - 11;
    if (off < 0) {
        off += 12;
    }
    if (b11 - a11 > 365) {
        var leapOff = getLeapMonthOffset(a11, timeZone);
        var leapMonth = leapOff - 2;
        if (leapMonth < 0) {
            leapMonth += 12;
        }
        if (lunarLeap && lunarMonth !== leapMonth) {
            return null;
        } else if (lunarLeap || off >= leapOff) {
            off += 1;
        }
    } else if (lunarLeap) {
        return null;
    }
    return jdToDate(getNewMoonDay(k + off, timeZone) + lunarDay - 1);
}

var TUAN = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
var CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
var CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

var TIETKHI = [
    "Xuân phân", "Thanh minh", "Cốc vũ", "Lập hạ", "Tiểu mãn", "Mang chủng",
    "Hạ chí", "Tiểu thử", "Đại thử", "Lập thu", "Xử thử", "Bạch lộ",
    "Thu phân", "Hàn lộ", "Sương giáng", "Lập đông", "Tiểu tuyết", "Đại tuyết",
    "Đông chí", "Tiểu hàn", "Đại hàn", "Lập xuân", "Vũ Thủy", "Kinh trập"
];

var GIO_HD = ["110100101100", "001101001011", "110011010010", "101100110100", "001011001101", "010010110011"];

function yearCanChi(lunarYear) {
    return CAN[(lunarYear + 6) % 10] + " " + CHI[(lunarYear + 8) % 12];
}

function monthCanChi(lunarYear, lunarMonth) {
    return CAN[(lunarYear * 12 + lunarMonth + 3) % 10] + " " + CHI[(lunarMonth + 1) % 12];
}

function dayCanChi(jd) {
    return CAN[(jd + 9) % 10] + " " + CHI[(jd + 1) % 12];
}

function hour0Can(jd) {
    return CAN[((jd - 1) * 2) % 10];
}

function gioHoangDao(jd) {
    var pattern = GIO_HD[((jd + 1) % 12) % 6];
    var out = [];
    for (var i = 0; i < 12; i++) {
        if (pattern.charAt(i) === "1") {
            out.push({ chi: CHI[i], from: (i * 2 + 23) % 24, to: (i * 2 + 1) % 24 });
        }
    }
    return out;
}

function sunLongitudeApparent(jdn) {
    var T = (jdn - 2451545.0) / 36525;
    var T2 = T * T;
    var dr = PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    var theta = L0 + DL;
    var omega = 125.04 - 1934.136 * T;
    var lambda = (theta - 0.00569 - 0.00478 * Math.sin(omega * dr)) * dr;
    lambda = lambda - PI * 2 * INT(lambda / (PI * 2));
    return lambda;
}

function getSolarTerm(dayNumber, timeZone) {
    return INT(sunLongitudeApparent(dayNumber - 0.5 - timeZone / 24.0) / PI * 12);
}

var LUNAR_FESTIVALS = [
    { day: 1,  month: 1,  name: "Tết Nguyên Đán" },
    { day: 15, month: 1,  name: "Rằm tháng Giêng" },
    { day: 3,  month: 3,  name: "Tết Hàn Thực" },
    { day: 10, month: 3,  name: "Giỗ Tổ Hùng Vương" },
    { day: 15, month: 4,  name: "Lễ Phật Đản" },
    { day: 5,  month: 5,  name: "Tết Đoan Ngọ" },
    { day: 15, month: 7,  name: "Lễ Vu Lan" },
    { day: 15, month: 8,  name: "Tết Trung Thu" },
    { day: 23, month: 12, name: "Ông Công, Ông Táo chầu trời" }
];

function findFestivals(lunar, jd, timeZone) {
    var out = [];
    if (lunar.leap) {
        return out;
    }
    for (var i = 0; i < LUNAR_FESTIVALS.length; i++) {
        var f = LUNAR_FESTIVALS[i];
        if (f.day === lunar.day && f.month === lunar.month) {
            out.push(f.name);
        }
    }
    if (lunar.month === 12 && lunar.day >= 29) {
        var n = jdToDate(jd + 1);
        var next = convertSolar2Lunar(n.day, n.month, n.year, timeZone);
        if (next.day === 1 && next.month === 1) {
            out.push("Giao thừa");
        }
    }
    return out;
}

function nextFestival(fromJd, timeZone) {
    if (timeZone === undefined) {
        timeZone = 7;
    }
    var d = jdToDate(fromJd);
    var lunarYear = convertSolar2Lunar(d.day, d.month, d.year, timeZone).year;
    var best = null;

    function consider(name, jd) {
        if (jd >= fromJd && (best === null || jd < best.jd)) {
            best = { name: name, jd: jd };
        }
    }

    for (var y = lunarYear; y <= lunarYear + 1; y++) {
        for (var i = 0; i < LUNAR_FESTIVALS.length; i++) {
            var f = LUNAR_FESTIVALS[i];
            var s = convertLunar2Solar(f.day, f.month, y, 0, timeZone);
            if (s) {
                consider(f.name, jdFromDate(s.day, s.month, s.year));
            }
        }
        var tet = convertLunar2Solar(1, 1, y, 0, timeZone);
        if (tet) {
            consider("Giao thừa", jdFromDate(tet.day, tet.month, tet.year) - 1);
        }
    }
    return best;
}

function getDayInfo(dd, mm, yy, timeZone) {
    if (timeZone === undefined) {
        timeZone = 7;
    }
    var jd = jdFromDate(dd, mm, yy);
    var lunar = convertSolar2Lunar(dd, mm, yy, timeZone);
    var term = getSolarTerm(jd + 1, timeZone);
    var termAtStart = getSolarTerm(jd, timeZone);
    return {
        jd: jd,
        weekday: TUAN[(jd + 1) % 7],
        lunar: lunar,
        yearCanChi: yearCanChi(lunar.year),
        monthCanChi: monthCanChi(lunar.year, lunar.month),
        dayCanChi: dayCanChi(jd),
        solarTerm: TIETKHI[term],
        solarTermStarts: term !== termAtStart,
        gioHoangDao: gioHoangDao(jd),
        festivals: findFestivals(lunar, jd, timeZone)
    };
}
