"use strict";

window.addEventListener("DOMContentLoaded", function () {
    const jsRequiredNotice = document.querySelector("#js-required");
    jsRequiredNotice.parentNode.removeChild(jsRequiredNotice);
    const blocklist = Blocklist.blocklist;
    const blocklistCount = blocklist.length;
    document.querySelector("#block .summary a").textContent =
        blocklistCount === 0 ? "nobody" : blocklistCount === 1 ? "1 person" : blocklistCount + " people";
    const blocklistNode = document.querySelector("#blocklist");
    if (blocklistCount > 0)
    {
        const fragment = document.createDocumentFragment();
        const prefix = document.location.protocol === "file:" ? "../index.html#" : "../#";
        var firstp = true;
        blocklist.forEach(function (id) {
            if (firstp)
                firstp = false;
            else
                fragment.appendChild(document.createTextNode(", "));
            const personNode = document.createElement("a");
            personNode.setAttribute("target", "blocked");
            personNode.textContent = id.replace(/_/g, " ");
            personNode.href = prefix + id;
            fragment.appendChild(personNode);
        });
        fragment.appendChild(document.createTextNode("."));
        blocklistNode.textContent = "You are blocking: ";
        blocklistNode.appendChild(fragment);
    }
});
