"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LegalSection, LegalShell } from "../legal/LegalShell";

const UPDATED = "26 July 2026";

export function PrivacyContent() {
  const { locale } = useLocale();
  const vi = locale === "vi";

  return (
    <LegalShell titleKey="legal.privacy.title" updated={UPDATED}>
      {vi ? <PrivacyVi /> : <PrivacyEn />}
    </LegalShell>
  );
}

function PrivacyEn() {
  return (
    <>
      <LegalSection title="A. Imprint / provider information">
        <p>Provider of Partner Studio and related partner tools:</p>
        <dl className="space-y-3 rounded-soft border border-line bg-foam/60 px-5 py-5">
          <div>
            <dt className="text-sm font-medium text-muted">Service name</dt>
            <dd className="mt-0.5 text-charcoal">Da Nang Expat Rentals — Partner Studio</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Responsible person</dt>
            <dd className="mt-0.5 text-charcoal">Benjamin</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Place of business</dt>
            <dd className="mt-0.5 text-charcoal">Da Nang, Vietnam</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Email</dt>
            <dd className="mt-0.5">
              <a
                href="mailto:benjamin@danangexpatrentals.com"
                className="font-medium text-ocean transition hover:text-ocean-deep"
              >
                benjamin@danangexpatrentals.com
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection title="B. Privacy — overview">
        <p>
          This notice explains how we process personal data in Partner Studio
          (accounts, listings, contacts, invites, and integrations). The public
          renter website has its own{" "}
          <a
            href="https://danangexpatrentals.com/privacy"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            Imprint & Privacy
          </a>{" "}
          page for visitor leads.
        </p>
      </LegalSection>

      <LegalSection title="1. Data we process">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-charcoal">Account data:</span> email,
            password (hashed by our auth provider), display name, role, company
            affiliation.
          </li>
          <li>
            <span className="font-medium text-charcoal">Workspace data:</span>{" "}
            listings, photos, commissions notes, contacts/CRM fields you enter,
            team invites.
          </li>
          <li>
            <span className="font-medium text-charcoal">Integrations:</span> tokens
            and page/group metadata when you connect Facebook or similar tools.
          </li>
          <li>
            <span className="font-medium text-charcoal">Technical logs:</span>{" "}
            security and hosting logs as needed to operate the service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Purposes">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide and secure Partner Studio for your company.</li>
          <li>Support matching between renters and your inventory.</li>
          <li>Enable team collaboration and optional posting integrations.</li>
          <li>Improve the product and prevent abuse.</li>
          <li>Meet legal obligations when required.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Sharing">
        <p>
          We use infrastructure providers (hosting, auth, database, email) to run
          the Studio. We do not sell partner account data. Within your company
          workspace, team members you invite can see shared listings and contacts.
          Admins of Da Nang Expat Rentals may access workspaces as needed for
          support, approvals, or abuse prevention.
        </p>
      </LegalSection>

      <LegalSection title="4. Your responsibilities as a controller">
        <p>
          When you store third-party personal data (e.g. renter phone numbers) in
          Contacts, you typically act as an independent controller for that data.
          Collect and use it lawfully, keep it accurate, and delete it when no
          longer needed.
        </p>
      </LegalSection>

      <LegalSection title="5. Retention">
        <p>
          Account and workspace data are kept while your partnership is active and
          for a reasonable period afterward for backups, disputes, or legal needs.
          You may request deletion of your account data by emailing us.
        </p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>
          We operate from Vietnam and may use processors in other countries.
          Reasonable safeguards are applied consistent with the tools we use.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          Subject to applicable law, you may request access, correction, or
          deletion of personal data we hold about you as a partner user. Contact{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Changes">
        <p>
          We may update this notice; the date above will change when we do.
        </p>
      </LegalSection>

      <LegalSection title="9. Related terms">
        <p>
          Partner Studio use is also governed by our{" "}
          <Link href="/terms" className="font-medium text-ocean transition hover:text-ocean-deep">
            Terms & Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}

function PrivacyVi() {
  return (
    <>
      <LegalSection title="A. Imprint / thông tin nhà cung cấp">
        <p>Nhà cung cấp Partner Studio và công cụ đối tác liên quan:</p>
        <dl className="space-y-3 rounded-soft border border-line bg-foam/60 px-5 py-5">
          <div>
            <dt className="text-sm font-medium text-muted">Tên dịch vụ</dt>
            <dd className="mt-0.5 text-charcoal">Da Nang Expat Rentals — Partner Studio</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Người chịu trách nhiệm</dt>
            <dd className="mt-0.5 text-charcoal">Benjamin</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Địa điểm kinh doanh</dt>
            <dd className="mt-0.5 text-charcoal">Đà Nẵng, Việt Nam</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Email</dt>
            <dd className="mt-0.5">
              <a
                href="mailto:benjamin@danangexpatrentals.com"
                className="font-medium text-ocean transition hover:text-ocean-deep"
              >
                benjamin@danangexpatrentals.com
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection title="B. Quyền riêng tư — tổng quan">
        <p>
          Thông báo này giải thích cách chúng tôi xử lý dữ liệu cá nhân trong
          Partner Studio (tài khoản, tin đăng, liên hệ, lời mời và tích hợp). Website
          công khai dành cho người thuê có trang{" "}
          <a
            href="https://danangexpatrentals.com/privacy"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            Imprint & Quyền riêng tư
          </a>{" "}
          riêng cho lead từ khách.
        </p>
      </LegalSection>

      <LegalSection title="1. Dữ liệu chúng tôi xử lý">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-charcoal">Dữ liệu tài khoản:</span>{" "}
            email, mật khẩu (đã hash bởi nhà cung cấp auth), tên hiển thị, vai trò,
            liên kết công ty.
          </li>
          <li>
            <span className="font-medium text-charcoal">Dữ liệu workspace:</span> tin
            đăng, ảnh, ghi chú hoa hồng, trường liên hệ/CRM bạn nhập, lời mời nhóm.
          </li>
          <li>
            <span className="font-medium text-charcoal">Tích hợp:</span> token và
            metadata trang/nhóm khi bạn kết nối Facebook hoặc công cụ tương tự.
          </li>
          <li>
            <span className="font-medium text-charcoal">Nhật ký kỹ thuật:</span> log
            bảo mật và hosting khi cần vận hành dịch vụ.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Mục đích">
        <ul className="list-disc space-y-2 pl-5">
          <li>Cung cấp và bảo mật Partner Studio cho công ty bạn.</li>
          <li>Hỗ trợ kết nối người thuê với tồn kho của bạn.</li>
          <li>Cho phép cộng tác nhóm và tích hợp đăng bài tuỳ chọn.</li>
          <li>Cải thiện sản phẩm và ngăn lạm dụng.</li>
          <li>Tuân thủ nghĩa vụ pháp lý khi có yêu cầu.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Chia sẻ">
        <p>
          Chúng tôi dùng nhà cung cấp hạ tầng (hosting, auth, database, email) để
          chạy Studio. Chúng tôi không bán dữ liệu tài khoản đối tác. Trong
          workspace công ty, thành viên bạn mời có thể xem tin đăng và liên hệ
          dùng chung. Admin của Da Nang Expat Rentals có thể truy cập workspace khi
          cần hỗ trợ, duyệt, hoặc chống lạm dụng.
        </p>
      </LegalSection>

      <LegalSection title="4. Trách nhiệm của bạn với tư cách bên kiểm soát">
        <p>
          Khi bạn lưu dữ liệu cá nhân bên thứ ba (ví dụ số điện thoại người thuê)
          trong Liên hệ, bạn thường đóng vai trò bên kiểm soát độc lập đối với dữ
          liệu đó. Thu thập và dùng hợp pháp, giữ chính xác, và xoá khi không còn
          cần.
        </p>
      </LegalSection>

      <LegalSection title="5. Lưu trữ">
        <p>
          Dữ liệu tài khoản và workspace được giữ khi quan hệ đối tác còn hiệu lực
          và thêm một thời gian hợp lý sau đó cho backup, tranh chấp hoặc nhu cầu
          pháp lý. Bạn có thể yêu cầu xoá dữ liệu tài khoản qua email.
        </p>
      </LegalSection>

      <LegalSection title="6. Chuyển dữ liệu quốc tế">
        <p>
          Chúng tôi vận hành từ Việt Nam và có thể dùng bộ xử lý ở nước khác. Các
          biện pháp bảo vệ hợp lý được áp dụng theo công cụ chúng tôi dùng.
        </p>
      </LegalSection>

      <LegalSection title="7. Quyền của bạn">
        <p>
          Tuỳ luật áp dụng, bạn có thể yêu cầu truy cập, sửa hoặc xoá dữ liệu cá
          nhân chúng tôi giữ về bạn với tư cách người dùng đối tác. Liên hệ{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Thay đổi">
        <p>
          Chúng tôi có thể cập nhật thông báo này; ngày ở trên sẽ đổi khi cập nhật.
        </p>
      </LegalSection>

      <LegalSection title="9. Điều khoản liên quan">
        <p>
          Việc dùng Partner Studio cũng chịu{" "}
          <Link href="/terms" className="font-medium text-ocean transition hover:text-ocean-deep">
            Điều khoản & Điều kiện
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
