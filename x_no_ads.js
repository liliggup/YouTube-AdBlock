// X (Twitter) 去广告 — QuantumultX script-response-body
// 原理:X 把广告混进时间线数据一起返回,广告条目带明确的推广标记
// (entryId 以 promoted 开头,或条目内带 promotedMetadata 字段)。
// 本脚本递归扫描返回的 JSON,摘掉带推广标记的条目;
// 响应过大、正文不含 promoted 字样、或解析出错时,一律原样放行,绝不影响正常使用。
// v2:配合 XAds.conf 只处理时间线/搜索接口,不碰推文详情,避免影响视频加载。

function isAdEntry(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  if (typeof obj.entryId === "string" && /^(promoted|ad|sponsored)[-_]/i.test(obj.entryId)) return true;
  if (obj.promotedMetadata || obj.promoted_metadata || obj.adMetadata || obj.ad_metadata) return true;
  var ic = null;
  if (obj.content && obj.content.itemContent) ic = obj.content.itemContent;
  if (!ic && obj.content && obj.content.item && obj.content.item.itemContent) ic = obj.content.item.itemContent;
  if (!ic && obj.item && obj.item.itemContent) ic = obj.item.itemContent;
  if (ic) {
    if (ic.promotedMetadata || ic.promoted_metadata) return true;
    if (ic.clientEventInfo && typeof ic.clientEventInfo.component === "string" && /^promoted/i.test(ic.clientEventInfo.component)) return true;
  }
  return false;
}

function clean(node) {
  if (Array.isArray(node)) {
    var out = [];
    for (var i = 0; i < node.length; i++) {
      if (isAdEntry(node[i])) continue;
      out.push(clean(node[i]));
    }
    return out;
  }
  if (node && typeof node === "object") {
    var keys = Object.keys(node);
    for (var j = 0; j < keys.length; j++) node[keys[j]] = clean(node[keys[j]]);
    return node;
  }
  return node;
}

try {
  var body = $response.body;
  if (!body || body.length > 2000000 || (body.indexOf("promoted") === -1 && body.indexOf("Promoted") === -1)) {
    $done({});
  } else {
    var data = JSON.parse(body);
    data = clean(data);
    $done({ body: JSON.stringify(data) });
  }
} catch (e) {
  $done({});
}
