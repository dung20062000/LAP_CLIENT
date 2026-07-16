/**
 * HƯỚNG DẪN CÀI ĐẶT VS CODE SNIPPETS
 * ====================================
 *
 * 1. Mở VS Code
 * 2. Vào File > Preferences > Configure User Snippets
 * 3. Chọn "typescript.json" (hoặc tạo mới nếu chưa có)
 * 4. Copy toàn bộ nội dung trong phần [SNIPPET CONFIG] bên dưới vào file đó
 * 5. Lưu và đóng file
 *
 * CÁCH SỬ DỤNG:
 * - Gõ "fileheader" + Tab -> Header comment đầu file
 * - Gõ "blockcomment" + Tab -> Block comment cho method/class
 * - Gõ "inlinecomment" + Tab -> Inline comment kèm ngày
 * - Gõ "propcomment" + Tab -> Block comment ngắn cho property
 *
 * ================================================
 * [SNIPPET CONFIG] - Copy từ dòng này trở xuống
 * ================================================
 */

{
  // Header comment cho đầu file TypeScript
  "Header File Comment": {
    "scope": "typescript,typescriptreact",
    "prefix": "fileheader",
    "body": [
      "/**",
      " * Mô tả: ${1:Chức năng của file}",
      " * Người tạo: DungBT",
      " * Ngày tạo: $CURRENT_DATE/$CURRENT_MONTH/$CURRENT_YEAR",
      " */",
      "$0"
    ],
    "description": "Tạo Header comment chuẩn cho đầu file TypeScript"
  },

  // Block comment cho Class, Method, Properties, Logic phức tạp
  "Block Comment Method/Class": {
    "scope": "typescript,typescriptreact",
    "prefix": "blockcomment",
    "body": [
      "/**",
      " * ${1:Nội dung ghi chú}",
      " * Người tạo: DungBT",
      " * Ngày tạo: $CURRENT_DATE/$CURRENT_MONTH/$CURRENT_YEAR",
      " */",
      "$0"
    ],
    "description": "Tạo Block Comment chuẩn cho Class, Method, Properties, Logic phức tạp"
  },

  // Inline comment kèm ngày tạo
  "Inline Comment với Ngày tạo": {
    "scope": "typescript,typescriptreact",
    "prefix": "inlinecomment",
    "body": [
      "// ${1:Dùng để ...}",
      "// Người tạo: DungBT",
      "// Ngày tạo: $CURRENT_DATE/$CURRENT_MONTH/$CURRENT_YEAR",
      "$0"
    ],
    "description": "Tạo Inline Comment kèm ngày tháng tự động"
  },

  // Block comment ngắn cho property đơn giản
  "Block Comment Property": {
    "scope": "typescript,typescriptreact",
    "prefix": "propcomment",
    "body": [
      "// ${1:Mô tả property}",
      "// Người tạo: DungBT",
      "// Ngày tạo: $CURRENT_DATE/$CURRENT_MONTH/$CURRENT_YEAR",
      "$0"
    ],
    "description": "Tạo block comment ngắn cho property"
  }
}
