/* 深度搜索 树状数据搜索 */
export const deepSearch = (data, value, key = 'id', sub = 'children', tempObj = {}) => {
    if (value && data) {
        data.find((node) => {
            if (node[key] == value) {
                tempObj.found = node;
                return node;
            }
            return deepSearch(node[sub], value, key, sub, tempObj);
        });
        if (tempObj.found) {
            return tempObj.found;
        }
    }
    return false;
}

/* 深度map */
export const deepMap = (data, key = 'id', sub = 'children') => {
    if (!data) return false
    const results = []

    data.forEach((d) => {
        if (d[key]) results.push(d[key])
        if (d[sub]) {
            const subMap = deepMap(d[sub], key, sub)
            if (subMap) results.push(...subMap)
        }
    })

    return results;
}
