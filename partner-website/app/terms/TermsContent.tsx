"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LegalSection, LegalShell } from "../legal/LegalShell";

const UPDATED = "26 July 2026";

export function TermsContent() {
  const { locale } = useLocale();
  const vi = locale === "vi";

  return (
    <LegalShell titleKey="legal.terms.title" updated={UPDATED}>
      {vi ? <TermsVi /> : <TermsEn />}
    </LegalShell>
  );
}

function TermsEn() {
  return (
    <>
      <LegalSection title="1. Who we are">
        <p>
          These Terms & Conditions (“Terms”) apply to Partner Studio and related
          partner tools operated by Da Nang Expat Rentals (“we”, “us”, “our”).
          Contact:{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          . Provider details are in{" "}
          <Link href="/privacy" className="font-medium text-ocean transition hover:text-ocean-deep">
            Imprint & Privacy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptance">
        <p>
          By creating or using a Partner Studio account, accepting an invite, or
          managing listings/contacts for your company, you agree to these Terms on
          behalf of yourself and the estate company you represent.
        </p>
      </LegalSection>

      <LegalSection title="3. The Partner Studio service">
        <p>
          Partner Studio helps agents and owners manage listings, contacts, share
          guides, and (where enabled) connect tools such as Facebook. We introduce
          international renters to partners; we are not a party to leases between
          you and tenants unless we expressly agree in writing.
        </p>
      </LegalSection>

      <LegalSection title="4. Your account and team">
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep login credentials confidential and use strong passwords.</li>
          <li>
            Only invite colleagues who are authorised to act for your company.
          </li>
          <li>
            You are responsible for activity under your company workspace,
            including actions by invited team members.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Listings and content you provide">
        <p>You represent that listings, photos, prices, and descriptions you submit are:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Accurate and not misleading at the time you publish or share them.</li>
          <li>Lawful to advertise, and that you have rights to use the media.</li>
          <li>Updated promptly when a unit is rented, withdrawn, or materially changed.</li>
        </ul>
        <p>
          We may review, hide, or remove content that appears fraudulent, unsafe,
          or inconsistent with our quality standards.
        </p>
      </LegalSection>

      <LegalSection title="6. Contacts and personal data">
        <p>
          If you store renter or lead contact details in Partner Studio, you must
          only do so for legitimate rental business purposes, in line with
          applicable privacy laws, and our{" "}
          <Link href="/privacy" className="font-medium text-ocean transition hover:text-ocean-deep">
            Imprint & Privacy
          </Link>{" "}
          notice. Do not upload data you are not allowed to process.
        </p>
      </LegalSection>

      <LegalSection title="7. Integrations">
        <p>
          Optional integrations (e.g. Facebook) are subject to those platforms’
          terms. Connecting an account authorises us to use the permissions you
          grant for the stated features. You can disconnect integrations in
          Settings.
        </p>
      </LegalSection>

      <LegalSection title="8. Acceptable use">
        <p>You must not use Partner Studio to spam, scrape, harass, commit fraud, or
          violate housing, advertising, or privacy laws. We may suspend access for
          misuse or security risk.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          The Studio software, branding, and our published guides remain ours (or
          our licensors’). Your listing content remains yours; you grant us a
          licence to host, display, and share it as needed to operate matching and
          partner features.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <p>
          The Studio is provided on an “as available” basis. To the fullest extent
          permitted by law, we are not liable for indirect or consequential losses,
          lost deals, or disputes between you and renters. Nothing excludes
          liability that cannot be limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes and termination">
        <p>
          We may update these Terms; the date above will change when we do.
          Continued use means acceptance. Either party may stop the partnership;
          we may disable accounts that breach these Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These Terms are governed by the laws of Vietnam. Courts in Da Nang,
          Vietnam, have non-exclusive jurisdiction unless mandatory rules require
          otherwise.
        </p>
      </LegalSection>
    </>
  );
}

function TermsVi() {
  return (
    <>
      <LegalSection title="1. Chúng tôi là ai">
        <p>
          Các Điều khoản & Điều kiện này (“Điều khoản”) áp dụng cho Partner Studio
          và công cụ đối tác liên quan do Da Nang Expat Rentals vận hành (“chúng
          tôi”). Liên hệ:{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          . Thông tin nhà cung cấp nằm trong{" "}
          <Link href="/privacy" className="font-medium text-ocean transition hover:text-ocean-deep">
            Imprint & Quyền riêng tư
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Chấp nhận">
        <p>
          Khi tạo hoặc dùng tài khoản Partner Studio, chấp nhận lời mời, hoặc quản
          lý tin đăng/liên hệ cho công ty của bạn, bạn đồng ý với các Điều khoản này
          thay mặt bản thân và công ty bất động sản bạn đại diện.
        </p>
      </LegalSection>

      <LegalSection title="3. Dịch vụ Partner Studio">
        <p>
          Partner Studio giúp môi giới và chủ nhà quản lý tin đăng, liên hệ, chia
          sẻ hướng dẫn, và (khi được bật) kết nối công cụ như Facebook. Chúng tôi
          giới thiệu người thuê quốc tế với đối tác; chúng tôi không phải bên trong
          hợp đồng thuê giữa bạn và khách thuê trừ khi có thoả thuận bằng văn bản.
        </p>
      </LegalSection>

      <LegalSection title="4. Tài khoản và nhóm">
        <ul className="list-disc space-y-2 pl-5">
          <li>Bảo mật thông tin đăng nhập và dùng mật khẩu mạnh.</li>
          <li>Chỉ mời đồng nghiệp được uỷ quyền hành động cho công ty.</li>
          <li>
            Bạn chịu trách nhiệm về hoạt động trong workspace công ty, gồm hành động
            của thành viên được mời.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Tin đăng và nội dung bạn cung cấp">
        <p>Bạn cam kết tin đăng, ảnh, giá và mô tả là:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Chính xác, không gây hiểu nhầm tại thời điểm đăng hoặc chia sẻ.</li>
          <li>Hợp pháp để quảng cáo, và bạn có quyền dùng media đó.</li>
          <li>Được cập nhật kịp thời khi căn đã thuê, rút, hoặc thay đổi lớn.</li>
        </ul>
        <p>
          Chúng tôi có thể xem xét, ẩn hoặc gỡ nội dung gian lận, không an toàn, hoặc
          không đạt chuẩn chất lượng.
        </p>
      </LegalSection>

      <LegalSection title="6. Liên hệ và dữ liệu cá nhân">
        <p>
          Nếu bạn lưu thông tin người thuê hoặc lead trong Partner Studio, chỉ dùng
          cho mục đích kinh doanh cho thuê hợp pháp, tuân thủ luật bảo vệ dữ liệu,
          và thông báo{" "}
          <Link href="/privacy" className="font-medium text-ocean transition hover:text-ocean-deep">
            Imprint & Quyền riêng tư
          </Link>
          . Không tải lên dữ liệu bạn không được phép xử lý.
        </p>
      </LegalSection>

      <LegalSection title="7. Tích hợp">
        <p>
          Tích hợp tuỳ chọn (ví dụ Facebook) chịu điều khoản của nền tảng đó. Kết
          nối tài khoản cho phép chúng tôi dùng quyền bạn cấp cho các tính năng đã
          nêu. Bạn có thể ngắt kết nối trong Cài đặt.
        </p>
      </LegalSection>

      <LegalSection title="8. Sử dụng hợp lệ">
        <p>
          Không dùng Partner Studio để spam, thu thập dữ liệu trái phép, quấy rối,
          gian lận, hoặc vi phạm luật nhà ở, quảng cáo hay quyền riêng tư. Chúng tôi
          có thể tạm khoá khi lạm dụng hoặc rủi ro bảo mật.
        </p>
      </LegalSection>

      <LegalSection title="9. Sở hữu trí tuệ">
        <p>
          Phần mềm Studio, thương hiệu và hướng dẫn do chúng tôi xuất bản thuộc về
          chúng tôi (hoặc bên cấp phép). Nội dung tin đăng của bạn vẫn thuộc bạn;
          bạn cấp cho chúng tôi giấy phép lưu trữ, hiển thị và chia sẻ khi cần để
          vận hành matching và tính năng đối tác.
        </p>
      </LegalSection>

      <LegalSection title="10. Trách nhiệm">
        <p>
          Studio được cung cấp theo tình trạng “có sẵn”. Trong phạm vi luật cho phép,
          chúng tôi không chịu trách nhiệm thiệt hại gián tiếp, mất giao dịch, hoặc
          tranh chấp giữa bạn và người thuê. Không loại trừ trách nhiệm mà luật bắt
          buộc.
        </p>
      </LegalSection>

      <LegalSection title="11. Thay đổi và chấm dứt">
        <p>
          Chúng tôi có thể cập nhật Điều khoản; ngày ở trên sẽ đổi khi cập nhật. Tiếp
          tục sử dụng nghĩa là chấp nhận. Mỗi bên có thể dừng hợp tác; chúng tôi có
          thể vô hiệu tài khoản vi phạm.
        </p>
      </LegalSection>

      <LegalSection title="12. Luật áp dụng">
        <p>
          Điều khoản này chịu luật Việt Nam. Toà án tại Đà Nẵng có thẩm quyền không
          độc quyền trừ khi quy định bắt buộc khác.
        </p>
      </LegalSection>
    </>
  );
}
