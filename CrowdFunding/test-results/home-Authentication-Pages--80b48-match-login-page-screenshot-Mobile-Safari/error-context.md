# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog "Failed to compile" [ref=e4]:
    - generic [ref=e5]:
      - heading "Failed to compile" [level=4] [ref=e7]
      - generic [ref=e8]:
        - generic [ref=e10]: "./src/app/auth/login/page.tsx:6:0 Module not found: Can't resolve '../../contexts/AuthContext' 4 | import Link from 'next/link'; 5 | import { useRouter } from 'next/navigation'; > 6 | import { useAuth } from '../../contexts/AuthContext'; 7 | import { Button } from '../../../components/ui/button'; 8 | import { Input } from '../../../components/ui/input'; 9 | import { Card } from '../../../components/ui/card'; https://nextjs.org/docs/messages/module-not-found"
        - contentinfo [ref=e11]:
          - paragraph [ref=e12]: This error occurred during the build process and can only be dismissed by fixing the error.
```