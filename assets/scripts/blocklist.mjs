export {
    blocklist,
    block,
    unblock,

    escapePersonID
}

function escapePersonID (personID) {
    return personID.replace(/'/g, "\\'");
}

const localStorage = globalThis.localStorage;

const blocklist = (localStorage && JSON.parse(localStorage.blocklist || "[]"));

function block (id) {
    if (blocklist.indexOf(id) <= 0)
    {
        blocklist.push(id);
        localStorage.blocklist = JSON.stringify(blocklist);
        document.querySelector("#" + escapePersonID(id)).classList.add("blocked");
        window.location.hash = "blocked";
    }
}

function unblock (id) {
    const index = blocklist.indexOf(id);
    if (index >= 0)
    {
        blocklist.splice(index, 1);
        localStorage.blocklist = JSON.stringify(blocklist);
        document.querySelector("#" + escapePersonID(id)).classList.remove("blocked");
    }
}
