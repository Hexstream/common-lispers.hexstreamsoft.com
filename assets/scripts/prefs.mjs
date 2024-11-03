import {
    StateDomainSchema,
    StateDomain
} from "https://global.hexstream.dev/scripts/state-domain.mjs";

import {
    bind,
    DocumentSelector
} from "https://global.hexstream.dev/scripts/event-binding.mjs";

export {
    preferences
}

const show_hide_if_accounts = {
    base: true,
    relevantIf: {
        "accounts.visibility": "show"
    }
};

function show_hide_if_category (category) {
    return {
        base: true,
        relevantIf: {
            "accounts.visibility": "show",
            [category]: "show"
        }
    };
}

const preferencesSchema = new StateDomainSchema(
    {
        "sort-order":
        {
            possibleValues: ["random", "alphabetical"]
        },

        "fullname.visibility":
        true,

        "middlename.visibility":
        true,

        "nickname.visibility":
        true,

        "website.visibility":
        true,

        "blog.visibility":
        true,

        "accounts.visibility":
        true,

        "/accounts/coding.visibility":
        show_hide_if_accounts,

        "/accounts/coding/github.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/coding/gitlab.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/coding/bitbucket.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/microblogging.visibility":
        show_hide_if_accounts,

        "/accounts/microblogging/twitter.visibility":
        show_hide_if_category("/accounts/microblogging.visibility"),

        "/accounts/microblogging/mastodon.visibility":
        show_hide_if_category("/accounts/microblogging.visibility"),

        "/accounts/keybase.visibility":
        show_hide_if_accounts,

        "highlights.visibility":
        true,

        "funding.visibility":
        true,

        "portal.visibility":
        true,

        "/accounts/cv.visibility":
        show_hide_if_accounts,

        "/accounts/cv/linkedin.visibility":
        show_hide_if_category("/accounts/cv.visibility"),

        "blocklist.status":
        {
            possibleValues: ["enabled", "disabled"]
        },

        "/blocklist/blocked.visibility":
        {
            base: false,
            relevantIf: {
                "blocklist.status": "enabled"
            }
        }
    });

const preferences = new StateDomain(preferencesSchema);

const localStorage = globalThis.localStorage;

bind("=",
     [
         {
             type: "storage",
             storage: localStorage
         },
         {
             type: "storage",
             storage: preferences
         }
     ],
     {
         source:
         {
             keys: preferences.schema.keys
         }
     }
    );
bind("=",
     [
         {
             type: "storage",
             storage: preferences
         },
         {
             type: "selector",
             selector: new DocumentSelector(document.documentElement, "site-prefs")
         }
     ]);
bind(">",
     [
         {
             type: "storage",
             storage: preferences,
             keys: preferences.schema.keys
         },
         {
             type: "tokenlist",
             tokenlist: document.documentElement.classList
         }
     ]);
