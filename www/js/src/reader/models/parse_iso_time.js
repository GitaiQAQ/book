 define(function() {
    return /msie 8/i.test(navigator.userAgent) ? function(dateString) {
        var resultDate, timebits = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})([+-])([0-9]{2}):([0-9]{2})/,
            m = timebits.exec(dateString),
            makeInt = function(string) {
                return parseInt(string, 10)
            };
        if (m) {
            var timestamp = Date.UTC(makeInt(m[1]), makeInt(m[2]) - 1, makeInt(m[3]), makeInt(m[4]), makeInt(m[5]), m[6] && makeInt(m[6]) || 0),
                date = new Date,
                offsetMinutes = date.getTimezoneOffset();
            if (m[8] && m[9]) {
                var timezoneOffset = 60 * makeInt(m[8]),
                    sign = "+" === m[7] ? -1 : 1;
                offsetMinutes += 60 * sign * timezoneOffset + makeInt(m[9])
            }
            timestamp += 6e4 * offsetMinutes, resultDate = new Date(timestamp)
        }
        return resultDate
    } : function(dateString) {
        return new Date(dateString)
    }
});