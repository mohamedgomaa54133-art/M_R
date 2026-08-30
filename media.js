/* =========================================================
   UPLOAD.JS
   IMAGE / VIDEO / FILE UPLOAD
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const attachBtn =
    document.getElementById("attachBtn");

const fileInput =
    document.getElementById("fileInput");


/* =========================================================
   VARIABLES
========================================================= */

let uploadUser = null;
let uploadBusy = false;


/* =========================================================
   AUTH
========================================================= */

auth.onAuthStateChanged((user) => {

    if (!user) {
        uploadUser = null;
        return;
    }

    uploadUser = user;

    console.log(
        "Upload user:",
        uploadUser.uid
    );
});


/* =========================================================
   OPEN FILE PICKER
========================================================= */

if (attachBtn && fileInput) {

    attachBtn.addEventListener(
        "click",
        () => {

            if (uploadBusy) {
                return;
            }

            fileInput.click();
        }
    );
}


/* =========================================================
   FILE SELECTED
========================================================= */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            await uploadFile(file);

            /*
             * السماح باختيار نفس الملف مرة أخرى
             */
            fileInput.value = "";
        }
    );
}


/* =========================================================
   UPLOAD FILE
========================================================= */

async function uploadFile(file) {

    if (!uploadUser) {

        alert(
            "يجب تسجيل الدخول أولاً"
        );

        return;
    }


    if (uploadBusy) {
        return;
    }


    /* =====================================================
       FILE SIZE
    ===================================================== */

    const maxImageSize =
        20 * 1024 * 1024;

    const maxVideoSize =
        100 * 1024 * 1024;

    const maxFileSize =
        50 * 1024 * 1024;


    let maxSize =
        maxFileSize;


    if (file.type.startsWith("image/")) {

        maxSize =
            maxImageSize;

    } else if (
        file.type.startsWith("video/")
    ) {

        maxSize =
            maxVideoSize;
    }


    if (file.size > maxSize) {

        alert(
            "حجم الملف كبير جداً"
        );

        return;
    }


    uploadBusy = true;


    try {

        showUploadProgress(
            0,
            file.name
        );


        /* =================================================
           FILE TYPE
        ================================================= */

        let messageType =
            "file";


        if (
            file.type.startsWith("image/")
        ) {

            messageType =
                "image";

        } else if (
            file.type.startsWith("video/")
        ) {

            messageType =
                "video";
        }


        /* =================================================
           UNIQUE FILE NAME
        ================================================= */

        const safeName =
            file.name
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        const fileName =
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 10) +
            "_" +
            safeName;


        /* =================================================
           STORAGE PATH
        ================================================= */

        const storageRef =
            storage
            .ref()
            .child(
                "chat-media/" +
                uploadUser.uid +
                "/" +
                fileName
            );


        /* =================================================
           UPLOAD
        ================================================= */

        const uploadTask =
            storageRef.put(
                file,
                {
                    contentType:
                        file.type ||
                        "application/octet-stream"
                }
            );


        uploadTask.on(

            "state_changed",

            (snapshot) => {

                const progress =
                    (
                        snapshot.bytesTransferred /
                        snapshot.totalBytes
                    ) * 100;


                showUploadProgress(
                    progress,
                    file.name
                );
            },


            (error) => {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );

                hideUploadProgress();

                alert(
                    "تعذر رفع الملف"
                );

                uploadBusy = false;
            },


            async () => {

                try {

                    /* =====================================
                       DOWNLOAD URL
                    ===================================== */

                    const downloadURL =
                        await uploadTask
                        .snapshot
                        .ref
                        .getDownloadURL();


                    /* =====================================
                       FIRESTORE MESSAGE
                    ===================================== */

                    const messageData = {

                        senderId:
                            uploadUser.uid,

                        type:
                            messageType,

                        text:
                            "",

                        fileName:
                            file.name,

                        fileType:
                            file.type ||
                            "application/octet-stream",

                        fileSize:
                            file.size,

                        fileUrl:
                            downloadURL,

                        storagePath:
                            uploadTask
                            .snapshot
                            .ref
                            .fullPath,

                        read:
                            false,

                        deleted:
                            false,

                        pinned:
                            false,

                        edited:
                            false,

                        createdAt:
                            firebase.firestore
                            .FieldValue
                            .serverTimestamp()
                    };


                    /* =================================
                       REPLY
                    ================================= */

                    if (
                        window.replyToMessage
                    ) {

                        messageData.replyTo =
                            window.replyToMessage;
                    }


                    await db
                        .collection("chats")
                        .doc("main")
                        .collection("messages")
                        .add(
                            messageData
                        );


                    /* =================================
                       SUCCESS
                    ================================= */

                    hideUploadProgress();

                    uploadBusy =
                        false;

                    console.log(
                        "File uploaded successfully:",
                        file.name
                    );

                } catch (error) {

                    console.error(
                        "SAVE MEDIA MESSAGE ERROR:",
                        error
                    );

                    hideUploadProgress();

                    uploadBusy =
                        false;

                    alert(
                        "تم رفع الملف ولكن تعذر إرسال الرسالة"
                    );
                }
            }
        );

    } catch (error) {

        console.error(
            "UPLOAD START ERROR:",
            error
        );

        hideUploadProgress();

        uploadBusy =
            false;

        alert(
            "حدث خطأ أثناء رفع الملف"
        );
    }
}


/* =========================================================
   UPLOAD PROGRESS UI
========================================================= */

function showUploadProgress(
    progress,
    fileName
) {

    let box =
        document.getElementById(
            "uploadProgressBox"
        );


    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "uploadProgressBox";

        box.innerHTML = `

            <div class="upload-progress-content">

                <div
                    id="uploadProgressName"
                    class="upload-progress-name"
                ></div>

                <div class="upload-progress-track">

                    <div
                        id="uploadProgressBar"
                        class="upload-progress-bar"
                    ></div>

                </div>

                <div
                    id="uploadProgressPercent"
                    class="upload-progress-percent"
                >
                    0%
                </div>

            </div>

        `;

        document.body.appendChild(
            box
        );
    }


    const name =
        document.getElementById(
            "uploadProgressName"
        );

    const bar =
        document.getElementById(
            "uploadProgressBar"
        );

    const percent =
        document.getElementById(
            "uploadProgressPercent"
        );


    if (name) {

        name.textContent =
            "رفع: " + fileName;
    }


    if (bar) {

        bar.style.width =
            Math.round(progress) + "%";
    }


    if (percent) {

        percent.textContent =
            Math.round(progress) + "%";
    }


    box.style.display =
        "flex";
}


/* =========================================================
   HIDE PROGRESS
========================================================= */

function hideUploadProgress() {

    const box =
        document.getElementById(
            "uploadProgressBox"
        );


    if (box) {

        box.style.display =
            "none";
    }
}