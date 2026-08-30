/* =========================================================
   PROFILE.JS
   START OF FILE
========================================================= */


/* =========================================================
   START — SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://qmigyzxkvrodnfyvjkbr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_BfnmEqlXE1YpUJnjP__JvQ_-nLQiP4a";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   END — SUPABASE CONFIG
========================================================= */


/* =========================================================
   START — PROFILE ELEMENTS
========================================================= */

const profileForm =
    document.getElementById("profileForm");

const usernameInput =
    document.getElementById("username");

const userHandleInput =
    document.getElementById("userHandle");

const birthDay =
    document.getElementById("birthDay");

const birthMonth =
    document.getElementById("birthMonth");

const birthYear =
    document.getElementById("birthYear");

const profileMessage =
    document.getElementById("profileMessage");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const profilePhotoPreview =
    document.getElementById("profilePhotoPreview");

const profilePhotoPlus =
    document.getElementById("profilePhotoPlus");


/* =========================================================
   END — PROFILE ELEMENTS
========================================================= */


/* =========================================================
   START — PROFILE PHOTO STATE
========================================================= */

let selectedProfilePhoto = null;


/* =========================================================
   END — PROFILE PHOTO STATE
========================================================= */


/* =========================================================
   START — BIRTH DAY OPTIONS
========================================================= */

for (let day = 1; day <= 31; day++) {

    const option =
        document.createElement("option");

    option.value = day;

    option.textContent = day;

    birthDay.appendChild(option);
}


/* =========================================================
   END — BIRTH DAY OPTIONS
========================================================= */


/* =========================================================
   START — BIRTH YEAR OPTIONS
========================================================= */

const currentYear =
    new Date().getFullYear();

for (
    let year = currentYear;
    year >= 1940;
    year--
) {

    const option =
        document.createElement("option");

    option.value = year;

    option.textContent = year;

    birthYear.appendChild(option);
}


/* =========================================================
   END — BIRTH YEAR OPTIONS
========================================================= */


/* =========================================================
   START — SELECT PROFILE PHOTO
========================================================= */

profilePhotoInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        if (!file) {
            return;
        }


        /* ---------------------------------------------
           CHECK FILE TYPE
        --------------------------------------------- */

        if (!file.type.startsWith("image/")) {

            profileMessage.textContent =
                "اختر صورة فقط.";

            this.value = "";

            return;
        }


        /* ---------------------------------------------
           CHECK FILE SIZE
        --------------------------------------------- */

        const maxSize =
            10 * 1024 * 1024;

        if (file.size > maxSize) {

            profileMessage.textContent =
                "حجم الصورة يجب ألا يتجاوز 10 ميجابايت.";

            this.value = "";

            return;
        }


        selectedProfilePhoto =
            file;


        /* ---------------------------------------------
           PREVIEW
        --------------------------------------------- */

        const imageUrl =
            URL.createObjectURL(file);

        profilePhotoPreview.src =
            imageUrl;

        profilePhotoPreview.style.display =
            "block";

        profilePhotoPlus.style.display =
            "none";

        profileMessage.textContent = "";

    }
);


/* =========================================================
   END — SELECT PROFILE PHOTO
========================================================= */


/* =========================================================
   START — CHECK LOGIN
========================================================= */

auth.onAuthStateChanged(async function (user) {

    if (!user) {

        window.location.replace("index.html");

        return;
    }


    try {

        const userRef =
            db.collection("users").doc(user.uid);

        const userDoc =
            await userRef.get();


        if (userDoc.exists) {

            const userData =
                userDoc.data();


            if (
                userData.username &&
                userData.userHandle &&
                userData.birthDate
            ) {

                window.location.replace(
                    "chat.html"
                );

                return;
            }


            /* -----------------------------------------
               LOAD EXISTING PROFILE PHOTO
            ----------------------------------------- */

            if (userData.photoUrl) {

                profilePhotoPreview.src =
                    userData.photoUrl;

                profilePhotoPreview.style.display =
                    "block";

                profilePhotoPlus.style.display =
                    "none";
            }


            /* -----------------------------------------
               LOAD EXISTING DATA
            ----------------------------------------- */

            if (userData.username) {

                usernameInput.value =
                    userData.username;
            }


            if (userData.userHandle) {

                userHandleInput.value =
                    userData.userHandle;
            }


            if (userData.birthDate) {

                const parts =
                    userData.birthDate.split("-");

                if (parts.length === 3) {

                    birthYear.value =
                        parts[0];

                    birthMonth.value =
                        String(
                            Number(parts[1])
                        );

                    birthDay.value =
                        String(
                            Number(parts[2])
                        );
                }
            }

        }


        usernameInput.focus();


    } catch (error) {

        console.error(
            "PROFILE CHECK ERROR:",
            error
        );

        profileMessage.textContent =
            "حدث خطأ أثناء تحميل البيانات.";

    }

});


/* =========================================================
   END — CHECK LOGIN
========================================================= */


/* =========================================================
   START — UPLOAD PROFILE PHOTO
========================================================= */

async function uploadProfilePhoto(
    user,
    file
) {

    if (!file) {
        return null;
    }


    /* ---------------------------------------------
       CREATE UNIQUE FILE PATH
    --------------------------------------------- */

    const fileExtension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const filePath =
        `profiles/${user.uid}/profile_${Date.now()}.${fileExtension}`;


    /* ---------------------------------------------
       UPLOAD
    --------------------------------------------- */

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("chat")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false
            }
        );


    if (uploadError) {

        console.error(
            "SUPABASE UPLOAD ERROR:",
            uploadError
        );

        throw uploadError;
    }


    /* ---------------------------------------------
       GET PUBLIC URL
    --------------------------------------------- */

    const {
        data
    } = supabaseClient
        .storage
        .from("chat")
        .getPublicUrl(filePath);


    return data.publicUrl;
}


/* =========================================================
   END — UPLOAD PROFILE PHOTO
========================================================= */


/* =========================================================
   START — SAVE PROFILE
========================================================= */

profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const userHandle =
            userHandleInput.value
                .trim()
                .toLowerCase();


        const day =
            birthDay.value;

        const month =
            birthMonth.value;

        const year =
            birthYear.value;


        /* ---------------------------------------------
           CHECK NAME
        --------------------------------------------- */

        if (username.length < 2) {

            profileMessage.textContent =
                "اكتب اسمًا من حرفين على الأقل.";

            return;
        }


        if (username.length > 30) {

            profileMessage.textContent =
                "الاسم يجب ألا يتجاوز 30 حرفًا.";

            return;
        }


        /* ---------------------------------------------
           CHECK USERNAME
        --------------------------------------------- */

        const usernamePattern =
            /^[a-zA-Z0-9_]+$/;


        if (
            userHandle.length < 3 ||
            !usernamePattern.test(userHandle)
        ) {

            profileMessage.textContent =
                "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام أو _ فقط.";

            return;
        }


        /* ---------------------------------------------
           CHECK BIRTH DATE
        --------------------------------------------- */

        if (!day || !month || !year) {

            profileMessage.textContent =
                "اختر تاريخ الميلاد كاملًا.";

            return;
        }


        const birthDate =
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        /* ---------------------------------------------
           START SAVE
        --------------------------------------------- */

        saveProfileBtn.disabled = true;

        saveProfileBtn.textContent =
            "جاري الحفظ...";

        profileMessage.textContent = "";


        try {

            const user =
                auth.currentUser;


            if (!user) {

                window.location.replace(
                    "index.html"
                );

                return;
            }


            /* -----------------------------------------
               UPLOAD PHOTO IF SELECTED
            ----------------------------------------- */

            let photoUrl = "";


            if (selectedProfilePhoto) {

                profileMessage.textContent =
                    "جاري رفع الصورة...";


                photoUrl =
                    await uploadProfilePhoto(
                        user,
                        selectedProfilePhoto
                    );
            }


            /* -----------------------------------------
               SAVE FIRESTORE
            ----------------------------------------- */

            const profileData = {

                uid: user.uid,

                email: user.email,

                username: username,

                userHandle: userHandle,

                birthDate: birthDate,

                updatedAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            };


            if (photoUrl) {

                profileData.photoUrl =
                    photoUrl;

                profileData.photoReady =
                    true;
            }


            await db
                .collection("users")
                .doc(user.uid)
                .set(
                    profileData,
                    {
                        merge: true
                    }
                );


            profileMessage.style.color =
                "#ffffff";

            profileMessage.textContent =
                "تم حفظ البيانات ✓";


            setTimeout(function () {

                window.location.replace(
                    "chat.html"
                );

            }, 700);


        } catch (error) {

            console.error(
                "PROFILE SAVE ERROR:",
                error
            );


            profileMessage.style.color =
                "#ff6868";


            if (
                error &&
                error.message
            ) {

                console.error(
                    error.message
                );
            }


            profileMessage.textContent =
                "تعذر حفظ البيانات. تأكد من إعدادات Supabase ثم حاول مرة أخرى.";


            saveProfileBtn.disabled =
                false;

            saveProfileBtn.textContent =
                "حفظ والمتابعة";

        }

    }
);


/* =========================================================
   END — SAVE PROFILE
========================================================= */


/* =========================================================
   PROFILE.JS
   END OF FILE
========================================================= */