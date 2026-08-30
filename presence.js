/* =========================================================
   PRESENCE.JS
   ONLINE / LAST SEEN / ACTIVITY SYSTEM
   FIREBASE AUTH + FIRESTORE
   START OF FILE
========================================================= */


/* =========================================================
   START — CONFIG
========================================================= */

const PRESENCE_COLLECTION = "presence";

/*
 * كل كام ثانية يتم تحديث حالة المستخدم.
 */
const PRESENCE_HEARTBEAT = 15000;

/*
 * بعد هذه المدة بدون تحديث نعتبر المستخدم Offline.
 */
const PRESENCE_TIMEOUT = 40000;


/* =========================================================
   END — CONFIG
========================================================= */


/* =========================================================
   START — ELEMENTS
========================================================= */

const presenceStatusElement =
    document.getElementById("chatUserStatus");

const presenceOnlineDot =
    document.getElementById("onlineDot");


/* =========================================================
   END — ELEMENTS
========================================================= */


/* =========================================================
   START — STATE
========================================================= */

let presenceCurrentUser = null;

let presencePartnerUid = null;

let presenceHeartbeatTimer = null;

let presencePartnerUnsubscribe = null;

let presenceInitialized = false;

let currentActivity = "online";


/*
 * الحالات المسموح بها:
 *
 * online
 * typing
 * recording
 * uploading
 */

const PRESENCE_ACTIVITIES = {

    online: "متصل الآن",

    typing: "يكتب...",

    recording: "تسجيل صوتي...",

    uploading: "يرسل وسيط..."

};


/* =========================================================
   END — STATE
========================================================= */


/* =========================================================
   START — LAST SEEN FORMAT
========================================================= */

function formatLastSeen(timestamp) {

    if (!timestamp) {

        return "غير متصل";

    }


    let date = null;


    /*
     * Firestore Timestamp
     */

    if (
        timestamp &&
        typeof timestamp.toDate === "function"
    ) {

        date = timestamp.toDate();

    }


    /*
     * JavaScript Date
     */

    else if (
        timestamp instanceof Date
    ) {

        date = timestamp;

    }


    /*
     * Milliseconds
     */

    else if (
        typeof timestamp === "number"
    ) {

        date = new Date(timestamp);

    }


    /*
     * String
     */

    else {

        date = new Date(timestamp);

    }


    if (
        !date ||
        isNaN(date.getTime())
    ) {

        return "غير متصل";

    }


    const now = new Date();


    const today =
        date.toDateString() ===
        now.toDateString();


    const yesterdayDate =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1
        );


    const yesterday =
        date.toDateString() ===
        yesterdayDate.toDateString();


    const timeText =
        date.toLocaleTimeString(
            "ar-EG",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    if (today) {

        return (
            "آخر ظهور اليوم " +
            timeText
        );

    }


    if (yesterday) {

        return (
            "آخر ظهور أمس " +
            timeText
        );

    }


    const dateText =
        date.toLocaleDateString(
            "ar-EG",
            {
                day: "numeric",
                month: "long"
            }
        );


    return (
        "آخر ظهور " +
        dateText +
        " " +
        timeText
    );

}


/* =========================================================
   END — LAST SEEN FORMAT
========================================================= */


/* =========================================================
   START — UPDATE UI
========================================================= */

function updatePresenceUI(
    online,
    activity,
    lastSeen
) {

    if (!presenceStatusElement) {

        return;

    }


    /*
     * المستخدم Online
     */

    if (online) {

        let text =
            PRESENCE_ACTIVITIES[
                activity
            ] ||
            PRESENCE_ACTIVITIES.online;


        presenceStatusElement.textContent =
            text;


        presenceStatusElement.classList.add(
            "is-online"
        );


        presenceStatusElement.classList.remove(
            "is-offline"
        );


        /*
         * نقطة Online
         */

        if (presenceOnlineDot) {

            presenceOnlineDot.style.display =
                "block";

            presenceOnlineDot.classList.add(
                "is-online"
            );

        }


        return;

    }


    /*
     * المستخدم Offline
     */

    presenceStatusElement.textContent =
        formatLastSeen(
            lastSeen
        );


    presenceStatusElement.classList.remove(
        "is-online"
    );


    presenceStatusElement.classList.add(
        "is-offline"
    );


    /*
     * إخفاء النقطة
     */

    if (presenceOnlineDot) {

        presenceOnlineDot.style.display =
            "none";

        presenceOnlineDot.classList.remove(
            "is-online"
        );

    }

}


/* =========================================================
   END — UPDATE UI
========================================================= */


/* =========================================================
   START — GET SERVER TIMESTAMP
========================================================= */

function serverTimestamp() {

    return firebase.firestore
        .FieldValue
        .serverTimestamp();

}


/* =========================================================
   END — GET SERVER TIMESTAMP
========================================================= */


/* =========================================================
   START — CREATE PRESENCE DATA
========================================================= */

function createPresenceData() {

    if (!presenceCurrentUser) {

        return null;

    }


    return {

        uid:
            presenceCurrentUser.uid,

        online:
            true,

        activity:
            currentActivity,

        heartbeat:
            serverTimestamp(),

        lastSeen:
            serverTimestamp()

    };

}


/* =========================================================
   END — CREATE PRESENCE DATA
========================================================= */


/* =========================================================
   START — SET ONLINE
========================================================= */

async function setPresenceOnline() {

    if (!presenceCurrentUser) {

        return;

    }


    currentActivity =
        "online";


    try {

        await db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                presenceCurrentUser.uid
            )
            .set(
                {

                    uid:
                        presenceCurrentUser.uid,

                    online:
                        true,

                    activity:
                        currentActivity,

                    heartbeat:
                        serverTimestamp(),

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


    } catch (error) {

        console.error(
            "PRESENCE ONLINE ERROR:",
            error
        );

    }

}


/* =========================================================
   END — SET ONLINE
========================================================= */


/* =========================================================
   START — UPDATE ACTIVITY
========================================================= */

/*
 * هذه أهم دالة في الملف.
 *
 * chat.js سيستخدم:
 *
 * setUserActivity("typing")
 *
 * audio.js سيستخدم:
 *
 * setUserActivity("recording")
 *
 * upload.js سيستخدم:
 *
 * setUserActivity("uploading")
 *
 * وبعد انتهاء العملية:
 *
 * setUserActivity("online")
 */

async function setUserActivity(
    activity
) {

    if (!presenceCurrentUser) {

        return;

    }


    /*
     * التأكد من الحالة
     */

    if (
        !PRESENCE_ACTIVITIES[
            activity
        ]
    ) {

        activity =
            "online";

    }


    currentActivity =
        activity;


    try {

        await db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                presenceCurrentUser.uid
            )
            .set(
                {

                    uid:
                        presenceCurrentUser.uid,

                    online:
                        true,

                    activity:
                        currentActivity,

                    heartbeat:
                        serverTimestamp(),

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


    } catch (error) {

        console.error(
            "PRESENCE ACTIVITY ERROR:",
            error
        );

    }

}


/* =========================================================
   END — UPDATE ACTIVITY
========================================================= */


/* =========================================================
   START — HEARTBEAT
========================================================= */

async function presenceHeartbeat() {

    if (!presenceCurrentUser) {

        return;

    }


    try {

        await db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                presenceCurrentUser.uid
            )
            .set(
                {

                    uid:
                        presenceCurrentUser.uid,

                    online:
                        true,

                    activity:
                        currentActivity,

                    heartbeat:
                        serverTimestamp(),

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


    } catch (error) {

        console.error(
            "PRESENCE HEARTBEAT ERROR:",
            error
        );

    }

}


/* =========================================================
   END — HEARTBEAT
========================================================= */


/* =========================================================
   START — START HEARTBEAT
========================================================= */

function startPresenceHeartbeat() {

    stopPresenceHeartbeat();


    presenceHeartbeatTimer =
        setInterval(
            function () {

                presenceHeartbeat();

            },
            PRESENCE_HEARTBEAT
        );

}


/* =========================================================
   END — START HEARTBEAT
========================================================= */

function stopPresenceHeartbeat() {

    if (
        presenceHeartbeatTimer
    ) {

        clearInterval(
            presenceHeartbeatTimer
        );

        presenceHeartbeatTimer =
            null;

    }

}


/* =========================================================
   START — SET OFFLINE
========================================================= */

async function setPresenceOffline() {

    if (!presenceCurrentUser) {

        return;

    }


    try {

        await db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                presenceCurrentUser.uid
            )
            .set(
                {

                    uid:
                        presenceCurrentUser.uid,

                    online:
                        false,

                    activity:
                        "offline",

                    lastSeen:
                        serverTimestamp(),

                    heartbeat:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


    } catch (error) {

        console.error(
            "PRESENCE OFFLINE ERROR:",
            error
        );

    }

}


/* =========================================================
   END — SET OFFLINE
========================================================= */


/* =========================================================
   START — CHECK REAL ONLINE
========================================================= */

function checkRealOnline(data) {

    if (!data) {

        return false;

    }


    if (data.online !== true) {

        return false;

    }


    let heartbeatTime = null;


    if (
        data.heartbeat &&
        typeof data.heartbeat.toDate ===
        "function"
    ) {

        heartbeatTime =
            data.heartbeat
                .toDate()
                .getTime();

    }


    else if (
        typeof data.heartbeat ===
        "number"
    ) {

        heartbeatTime =
            data.heartbeat;

    }


    /*
     * لو Firestore لم يرجع timestamp
     * بعد، نثق مؤقتًا في online.
     */

    if (!heartbeatTime) {

        return true;

    }


    const difference =
        Date.now() -
        heartbeatTime;


    return (
        difference <
        PRESENCE_TIMEOUT
    );

}


/* =========================================================
   END — CHECK REAL ONLINE
========================================================= */


/* =========================================================
   START — WATCH PARTNER
========================================================= */

function watchPartnerPresence(
    partnerUid
) {

    if (!partnerUid) {

        updatePresenceUI(
            false,
            "offline",
            null
        );

        return;

    }


    /*
     * إلغاء المراقبة القديمة
     */

    if (
        presencePartnerUnsubscribe
    ) {

        presencePartnerUnsubscribe();

        presencePartnerUnsubscribe =
            null;

    }


    presencePartnerUid =
        partnerUid;


    presencePartnerUnsubscribe =
        db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                partnerUid
            )
            .onSnapshot(
                function (snapshot) {

                    if (
                        !snapshot.exists
                    ) {

                        updatePresenceUI(
                            false,
                            "offline",
                            null
                        );

                        return;

                    }


                    const data =
                        snapshot.data();


                    const online =
                        checkRealOnline(
                            data
                        );


                    if (online) {

                        updatePresenceUI(
                            true,
                            data.activity ||
                                "online",
                            data.lastSeen
                        );

                    } else {

                        updatePresenceUI(
                            false,
                            "offline",
                            data.lastSeen
                        );

                    }

                },
                function (error) {

                    console.error(
                        "PARTNER PRESENCE ERROR:",
                        error
                    );


                    updatePresenceUI(
                        false,
                        "offline",
                        null
                    );

                }
            );

}


/* =========================================================
   END — WATCH PARTNER
========================================================= */


/* =========================================================
   START — FIND PARTNER
========================================================= */

async function findChatPartner() {

    if (!presenceCurrentUser) {

        return;

    }


    /*
     * لو chat.js أعطانا UID
     */

    if (
        window.chatPartnerUid &&
        window.chatPartnerUid !==
            presenceCurrentUser.uid
    ) {

        watchPartnerPresence(
            window.chatPartnerUid
        );

        return;

    }


    /*
     * المشروع شخصين فقط.
     *
     * لذلك نبحث عن المستخدم الآخر.
     */

    try {

        const snapshot =
            await db
                .collection("users")
                .get();


        let partnerUid =
            null;


        snapshot.forEach(
            function (doc) {

                if (
                    doc.id !==
                    presenceCurrentUser.uid
                ) {

                    partnerUid =
                        doc.id;

                }

            }
        );


        if (partnerUid) {

            watchPartnerPresence(
                partnerUid
            );

        } else {

            updatePresenceUI(
                false,
                "offline",
                null
            );

        }


    } catch (error) {

        console.error(
            "FIND PARTNER ERROR:",
            error
        );


        updatePresenceUI(
            false,
            "offline",
            null
        );

    }

}


/* =========================================================
   END — FIND PARTNER
========================================================= */


/* =========================================================
   START — AUTH
========================================================= */

auth.onAuthStateChanged(
    async function (user) {

        /*
         * تسجيل الخروج
         */

        if (!user) {

            stopPresenceHeartbeat();


            if (
                presencePartnerUnsubscribe
            ) {

                presencePartnerUnsubscribe();

                presencePartnerUnsubscribe =
                    null;

            }


            presenceCurrentUser =
                null;

            presencePartnerUid =
                null;

            presenceInitialized =
                false;

            currentActivity =
                "online";


            updatePresenceUI(
                false,
                "offline",
                null
            );


            return;

        }


        presenceCurrentUser =
            user;


        /*
         * منع التهيئة أكثر من مرة
         */

        if (
            presenceInitialized
        ) {

            return;

        }


        presenceInitialized =
            true;


        /*
         * Online
         */

        await setPresenceOnline();


        /*
         * Heartbeat
         */

        startPresenceHeartbeat();


        /*
         * مراقبة رحمه
         */

        await findChatPartner();

    }
);


/* =========================================================
   END — AUTH
========================================================= */


/* =========================================================
   START — PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    function () {

        if (!presenceCurrentUser) {

            return;

        }


        /*
         * رجع للشاشة
         */

        if (
            document.visibilityState ===
            "visible"
        ) {

            setPresenceOnline();

            startPresenceHeartbeat();

        }


        /*
         * ذهب للخلفية
         */

        else {

            /*
             * لا نكتب Offline مباشرة.
             *
             * الهاتف ممكن يضع الصفحة
             * في الخلفية لثواني فقط.
             */

            stopPresenceHeartbeat();

        }

    }
);


/* =========================================================
   END — PAGE VISIBILITY
========================================================= */


/* =========================================================
   START — BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    function () {

        stopPresenceHeartbeat();


        if (!presenceCurrentUser) {

            return;

        }


        /*
         * محاولة أخيرة لحفظ آخر ظهور.
         */

        db
            .collection(
                PRESENCE_COLLECTION
            )
            .doc(
                presenceCurrentUser.uid
            )
            .set(
                {

                    online:
                        false,

                    activity:
                        "offline",

                    lastSeen:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );

    }
);


/* =========================================================
   END — BEFORE UNLOAD
========================================================= */


/* =========================================================
   START — PUBLIC API
========================================================= */


/*
 * تحديد UID الطرف الآخر.
 *
 * مثال:
 *
 * window.setChatPartnerUid("UID");
 */

window.setChatPartnerUid =
    function (uid) {

        if (!uid) {

            return;

        }


        if (
            presenceCurrentUser &&
            uid ===
                presenceCurrentUser.uid
        ) {

            return;

        }


        presencePartnerUid =
            uid;


        watchPartnerPresence(
            uid
        );

    };


/*
 * الحصول على المستخدم الحالي.
 */

window.getPresenceCurrentUser =
    function () {

        return presenceCurrentUser;

    };


/*
 * الحصول على UID الطرف الآخر.
 */

window.getChatPartnerUid =
    function () {

        return presencePartnerUid;

    };


/*
 * تغيير النشاط.
 *
 * typing
 * recording
 * uploading
 * online
 */

window.setUserActivity =
    function (activity) {

        return setUserActivity(
            activity
        );

    };


/*
 * دوال مختصرة جاهزة.
 */

window.setTyping =
    function () {

        return setUserActivity(
            "typing"
        );

    };


window.setRecording =
    function () {

        return setUserActivity(
            "recording"
        );

    };


window.setUploading =
    function () {

        return setUserActivity(
            "uploading"
        );

    };


window.setOnline =
    function () {

        return setUserActivity(
            "online"
        );

    };


/* =========================================================
   END — PUBLIC API
========================================================= */


/* =========================================================
   PRESENCE.JS
   END OF FILE
========================================================= */