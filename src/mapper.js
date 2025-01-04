export function formatSkills(skills) {
    return Object.entries(skills).reduce((str, [p, val]) => {
        return `${str} ${p} +${val}, `;
    }, "").slice(0, -2);
}

export function listValue(name, value) {
    return !value ? "" : `<b>${name}</b> ${value};`
}

export function listArray(name, array) {
    return array.length === 0 ? "" : `<b>${name}</b> ${array.join(", ")};`
}