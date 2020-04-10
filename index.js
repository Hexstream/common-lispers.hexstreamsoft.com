"use strict";

function maybeDecorateSelection () {
    if (preferences["blocklist.status"] === "disabled")
        return;
    const hash = document.location.hash;
    if (!hash)
        return;
    var target = document.querySelector(escapePersonID(decodeURIComponent(hash)));
    if (target && target.matches(".cards .card .nickname"))
        target = target.parentElement;
    if (target && target.matches(".cards .card") && !target.querySelector(".options"))
        target.appendChild(document.querySelector("#options-template").content.cloneNode(true));
}

function shuffle (array) {
    const max = array.length;
    for (let i = 0; i < max; i++) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

window.addEventListener("DOMContentLoaded", function () {
    Search.register();
    maybeDecorateSelection();
    window.addEventListener("hashchange", function (event) {
        maybeDecorateSelection();
    });
    const commonLispers = document.querySelector("#common-lispers");
    commonLispers.addEventListener("change", function (event) {
        const select = event.target;
        const action = select.value;
        select.value = "";
        if (action === "block" || action === "unblock")
            Blocklist[action](HexstreamSoft.dom.nodeOrAncestorSatisfying(select, node => node.matches(".card")).id);
    });
    if (preferences["blocklist.status"] === "enabled")
        Blocklist.blocklist.forEach(function (blocked) {
            const person = document.querySelector("#" + escapePersonID(blocked));
            if (person)
                person.classList.add("blocked");
        });
    if (preferences["sort-order"] === "random")
    {
        const fragment = document.createDocumentFragment();
        const shuffled = shuffle(Array.from(commonLispers.querySelectorAll(".card")));
        shuffled.forEach(function (person) {
            fragment.appendChild(person);
        });
        commonLispers.appendChild(fragment);
    }
    window.setTimeout(function () {
        const target = document.querySelector(".cards :target");
        if (target)
            target.scrollIntoView();
    }, 1000);
});
