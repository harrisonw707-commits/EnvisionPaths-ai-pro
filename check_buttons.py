import re

def find_nested_buttons(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # We need to handle tags like <button ...> and </button>
    tokens = re.finditer(r'<button\b[^>]*>| </button>', content)
    stack = []
    
    for match in tokens:
        tag = match.group(0).strip()
        line_no = content.count('\n', 0, match.start()) + 1
        
        if tag.startswith('<button'):
            if stack:
                print(f"NESTED BUTTON: Line {line_no} (Inside button started at line {stack[-1]})")
            stack.append(line_no)
        elif tag == '</button>':
            if stack:
                stack.pop()
            else:
                # print(f"UNMATCHED CLOSING BUTTON: Line {line_no}")
                pass

if __name__ == "__main__":
    import sys
    find_nested_buttons(sys.argv[1] if len(sys.argv) > 1 else 'src/App.tsx')
