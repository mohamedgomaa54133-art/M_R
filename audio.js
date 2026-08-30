/* =========================================================
   AUDIO.JS
   VOICE MESSAGES
   SUPABASE STORAGE + FIRESTORE

   NORMAL VOICE MESSAGE
   NO VIEW ONCE
   NO DOWNLOAD BUTTON
========================================================= */

console.log("AUDIO.JS STARTED");


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const AUDIO_SUPABASE_URL =
    "https://qmigyzxkvrodnfyvjkbr.supabase.co";

const AUDIO_SUPABASE_KEY =
    "sb_publishable_BfnmEqlXE1YpUJnjP__JvQ_-nLQiP4a";

const audioSupabase =
    window.supabase.createClient(
        AUDIO_SUPABASE_URL,
        AUDIO_SUPABASE_KEY
    );


/* =========================================================
   SETTINGS
========================================================= */

const AUDIO_CHAT_ID =
    "mohamed_rahma";

const AUDIO_BUCKET =
    "chat";


/* =========================================================
   DOM
========================================================= */

const recordBtn =
    document.getElementById("recordBtn");

const voiceRecordingBar =
    document.getElementById("voiceRecordingBar");

const cancelRecordingBtn =
    document.getElementById("cancelRecordingBtn");

const sendRecordingBtn =
    document.getElementById("sendRecordingBtn");

const recordingTime =
    document.getElementById("recordingTime");


/* =========================================================
   STATE
========================================================= */

let audioRecorder = null;

let audioChunks = [];

let recordedAudioBlob = null;

let recordingTimer = null;

let recordingSeconds = 0;

let isRecording = false;


/* =========================================================
   CHECK SUPPORT
========================================================= */

function isAudioRecordingSupported() {

    return (
        !!navigator.mediaDevices &&
        !!navigator.mediaDevices.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatRecordingTime(seconds) {

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateRecordingTimer() {

    if (!recordingTime)
        return;

    recordingTime.textContent =
        formatRecordingTime(
            recordingSeconds
        );

}


/* =========================================================
   START TIMER
========================================================= */

function startRecordingTimer() {

    recordingSeconds = 0;

    updateRecordingTimer();

    clearInterval(
        recordingTimer
    );

    recordingTimer =
        setInterval(
            function() {

                recordingSeconds++;

                updateRecordingTimer();

            },
            1000
        );

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopRecordingTimer() {

    clearInterval(
        recordingTimer
    );

    recordingTimer =
        null;

}


/* =========================================================
   SHOW RECORDING BAR
========================================================= */

function showRecordingBar() {

    if (!voiceRecordingBar)
        return;

    voiceRecordingBar.style.display =
        "flex";

}


/* =========================================================
   HIDE RECORDING BAR
========================================================= */

function hideRecordingBar() {

    if (!voiceRecordingBar)
        return;

    voiceRecordingBar.style.display =
        "none";

}


/* =========================================================
   GET MIME TYPE
========================================================= */

function getSupportedMimeType() {

    const types = [

        "audio/webm;codecs=opus",

        "audio/webm",

        "audio/mp4",

        "audio/ogg;codecs=opus",

        "audio/ogg"

    ];


    for (
        let i = 0;
        i < types.length;
        i++
    ) {

        if (
            MediaRecorder.isTypeSupported(
                types[i]
            )
        ) {

            return types[i];

        }

    }


    return "";

}


/* =========================================================
   START RECORDING
========================================================= */

async function startVoiceRecording() {

    if (isRecording)
        return;


    if (!isAudioRecordingSupported()) {

        alert(
            "المتصفح لا يدعم تسجيل الصوت."
        );

        return;
    }


    try {

        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true
                });


        audioChunks = [];

        recordedAudioBlob = null;


        const mimeType =
            getSupportedMimeType();


        const options =
            mimeType
                ? {
                    mimeType:
                        mimeType
                }
                : undefined;


        audioRecorder =
            new MediaRecorder(
                stream,
                options
            );


        audioRecorder.ondataavailable =
            function(event) {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    audioChunks.push(
                        event.data
                    );

                }

            };


        audioRecorder.onstop =
            function() {

                recordedAudioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type:
                                audioRecorder.mimeType ||
                                "audio/webm"
                        }
                    );


                stream
                    .getTracks()
                    .forEach(
                        function(track) {

                            track.stop();

                        }
                    );


                console.log(
                    "VOICE RECORDING READY"
                );

            };


        audioRecorder.start();

        isRecording =
            true;

        showRecordingBar();

        startRecordingTimer();


        console.log(
            "VOICE RECORDING STARTED"
        );


    } catch (error) {

        console.error(
            "VOICE RECORDING ERROR:",
            error
        );


        alert(
            "تعذر تشغيل الميكروفون.\n" +
            "تأكد من السماح للموقع باستخدام الميكروفون."
        );

    }

}


/* =========================================================
   STOP RECORDING
========================================================= */

function stopVoiceRecording() {

    if (
        !audioRecorder ||
        !isRecording
    )
        return;


    try {

        audioRecorder.stop();

    } catch (error) {

        console.error(
            "STOP RECORDING ERROR:",
            error
        );

    }


    isRecording =
        false;

    stopRecordingTimer();

}


/* =========================================================
   WAIT FOR RECORDER TO FINISH
========================================================= */

function stopVoiceRecordingAndWait() {

    return new Promise(
        function(resolve) {

            if (
                !audioRecorder ||
                !isRecording
            ) {

                resolve();

                return;
            }


            const recorder =
                audioRecorder;


            const originalOnStop =
                recorder.onstop;


            recorder.onstop =
                function(event) {

                    if (
                        typeof originalOnStop ===
                        "function"
                    ) {

                        originalOnStop.call(
                            recorder,
                            event
                        );

                    }


                    resolve();

                };


            try {

                recorder.stop();

            } catch (error) {

                console.error(
                    "STOP WAIT ERROR:",
                    error
                );

                resolve();

            }


            isRecording =
                false;

            stopRecordingTimer();

        }
    );

}


/* =========================================================
   CANCEL RECORDING
========================================================= */

function cancelVoiceRecording() {

    if (audioRecorder) {

        try {

            if (
                audioRecorder.state !==
                "inactive"
            ) {

                audioRecorder.stop();

            }

        } catch (error) {

            console.error(
                error
            );
        }

    }


    isRecording =
        false;

    stopRecordingTimer();


    audioChunks = [];

    recordedAudioBlob = null;


    if (audioRecorder) {

        try {

            audioRecorder.stream
                .getTracks()
                .forEach(
                    function(track) {

                        track.stop();

                    }
                );

        } catch (error) {}

    }


    audioRecorder =
        null;


    if (recordingTime) {

        recordingTime.textContent =
            "00:00";

    }


    hideRecordingBar();


    console.log(
        "VOICE RECORDING CANCELLED"
    );

}


/* =========================================================
   CREATE FILE EXTENSION
========================================================= */

function getAudioExtension(blob) {

    const type =
        blob.type || "";


    if (
        type.includes("mp4")
    )
        return "m4a";


    if (
        type.includes("ogg")
    )
        return "ogg";


    if (
        type.includes("webm")
    )
        return "webm";


    return "webm";

}


/* =========================================================
   UPLOAD AUDIO TO SUPABASE
========================================================= */

async function uploadVoiceToSupabase(
    user,
    blob
) {

    if (!user)
        throw new Error(
            "لا يوجد مستخدم مسجل."
        );


    if (!blob)
        throw new Error(
            "ملف الصوت غير موجود."
        );


    const extension =
        getAudioExtension(
            blob
        );


    const filePath =
        `voices/${user.uid}/voice_${Date.now()}.${extension}`;


    console.log(
        "UPLOADING VOICE:",
        filePath
    );


    const {
        error: uploadError
    } =
        await audioSupabase
            .storage
            .from(AUDIO_BUCKET)
            .upload(
                filePath,
                blob,
                {
                    cacheControl:
                        "3600",

                    contentType:
                        blob.type ||
                        "audio/webm",

                    upsert:
                        false
                }
            );


    if (uploadError) {

        console.error(
            "SUPABASE VOICE UPLOAD ERROR:",
            uploadError
        );

        throw uploadError;
    }


    const {
        data
    } =
        audioSupabase
            .storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(
                filePath
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "تعذر الحصول على رابط الصوت."
        );

    }


    return {

        url:
            data.publicUrl,

        path:
            filePath

    };

}


/* =========================================================
   GET CURRENT USER PROFILE
========================================================= */

async function getVoiceUserProfile(
    user
) {

    try {

        const doc =
            await db
                .collection("users")
                .doc(user.uid)
                .get();


        if (
            doc.exists
        ) {

            return (
                doc.data() || {}
            );

        }

    } catch (error) {

        console.error(
            "VOICE PROFILE ERROR:",
            error
        );

    }


    return {};

}


/* =========================================================
   SEND VOICE MESSAGE
========================================================= */

async function sendVoiceMessage() {

    if (
        !recordedAudioBlob
    ) {

        alert(
            "لم يتم تسجيل صوت."
        );

        return;

    }


    const user =
        auth.currentUser;


    if (!user) {

        alert(
            "يجب تسجيل الدخول أولاً."
        );

        return;

    }


    if (sendRecordingBtn) {

        sendRecordingBtn.disabled =
            true;

        sendRecordingBtn.textContent =
            "⏳";

    }


    try {

        /*
         * رفع الصوت
         */

        const uploaded =
            await uploadVoiceToSupabase(
                user,
                recordedAudioBlob
            );


        /*
         * تحميل بيانات المستخدم
         */

        const profile =
            await getVoiceUserProfile(
                user
            );


        const senderName =
            profile.username ||
            profile.displayName ||
            profile.name ||
            user.displayName ||
            user.email ||
            "المستخدم";


        /*
         * حفظ الرسالة
         *
         * لا يوجد:
         * viewOnce
         * opened
         * openedBy
         *
         * لأن التسجيل الصوتي رسالة عادية.
         */

        const messagesRef =
            db
                .collection("chats")
                .doc(AUDIO_CHAT_ID)
                .collection("messages");


        const voiceMessage = {

            senderId:
                user.uid,

            senderName:
                senderName,

            senderEmail:
                user.email || "",

            type:
                "voice",

            url:
                uploaded.url,

            storagePath:
                uploaded.path,

            duration:
                recordingSeconds,

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            edited:
                false,

            deleted:
                false,

            pinned:
                false,

            readBy: {

                [user.uid]:
                    true

            },

            hiddenFor:
                {}

        };


        /*
         * REPLY
         */

        if (
            typeof replyToMessage !==
            "undefined" &&
            replyToMessage
        ) {

            voiceMessage.replyTo = {

                messageId:
                    replyToMessage.id,

                senderId:
                    replyToMessage.senderId,

                senderName:
                    replyToMessage.senderName ||
                    "",

                text:
                    typeof getMessagePreviewText ===
                    "function"
                        ? getMessagePreviewText(
                            replyToMessage
                        )
                        : "🎤 رسالة صوتية"

            };

        }


        await messagesRef.add(
            voiceMessage
        );


        console.log(
            "VOICE MESSAGE SENT"
        );


        /*
         * تنظيف
         */

        audioChunks = [];

        recordedAudioBlob = null;

        audioRecorder = null;

        recordingSeconds = 0;


        if (recordingTime) {

            recordingTime.textContent =
                "00:00";

        }


        hideRecordingBar();


        /*
         * مسح الرد إن كانت الدالة موجودة
         */

        if (
            typeof clearReply ===
            "function"
        ) {

            clearReply();

        }


    } catch (error) {

        console.error(
            "SEND VOICE ERROR:",
            error
        );


        alert(
            "فشل إرسال التسجيل:\n" +
            error.message
        );


    } finally {

        if (sendRecordingBtn) {

            sendRecordingBtn.disabled =
                false;

            sendRecordingBtn.textContent =
                "➤";

        }

    }

}


/* =========================================================
   RECORD BUTTON
========================================================= */

if (recordBtn) {

    recordBtn.addEventListener(
        "click",
        async function() {

            if (!isRecording) {

                await startVoiceRecording();

            } else {

                stopVoiceRecording();

            }

        }
    );

}


/* =========================================================
   SEND RECORDING BUTTON
========================================================= */

if (sendRecordingBtn) {

    sendRecordingBtn.addEventListener(
        "click",
        async function() {

            /*
             * لو لسه بيسجل:
             * نوقف التسجيل وننتظر onstop
             */

            if (isRecording) {

                await stopVoiceRecordingAndWait();

            }


            await sendVoiceMessage();

        }
    );

}


/* =========================================================
   CANCEL RECORDING BUTTON
========================================================= */

if (cancelRecordingBtn) {

    cancelRecordingBtn.addEventListener(
        "click",
        function() {

            cancelVoiceRecording();

        }
    );

}


/* =========================================================
   INITIAL
========================================================= */

if (recordingTime) {

    recordingTime.textContent =
        "00:00";

}


console.log(
    "AUDIO.JS READY"
);