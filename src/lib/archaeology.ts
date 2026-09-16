import { StoredImage } from "@/components/StoredImage";
import { PhotoCropPositionControl, PhotoCropPreview } from "@/components/PhotoCropControls";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyMemoryDraft, type MemoryDraft } from "@/lib/memories";

function todayValue() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export function MemoryFormSheet({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MemoryDraft | undefined;
  title: string;
  submitLabel: string;
  onSubmit: (draft: MemoryDraft) => void;
}) {
  const [draft, setDraft] = useState<MemoryDraft>(emptyMemoryDraft);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial ?? { ...emptyMemoryDraft, date: todayValue() });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickPhoto(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((d) => ({ ...d, photo: String(reader.result ?? ""), photoPosition: 50 }));
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return setError("å¹«é€™æ®µå›æ†¶å–ä¸€å€‹åå­—");
    if (!draft.date) return setError("è«‹é¸æ“‡æ—¥æœŸ");
    onSubmit({ ...draft, title: draft.title.trim() });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-border/60 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>æŠŠé€™ä¸€å¤©çš„å¿ƒæƒ…å¯«ä¸‹ä¾† â™¡</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5 pt-1">
          <div>
            <p className="mb-2 text-sm font-medium">ç…§ç‰‡</p>
            {draft.photo ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/60">
                <PhotoCropPreview src={draft.photo} alt="å›æ†¶ç…§ç‰‡é è¦½" position={draft.photoPosition} aspectClass="aspect-[4/3]" />
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-card/90 px-3 py-1.5 text-xs shadow-soft"
                  >
                    é‡æ–°é¸æ“‡
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, photo: "" }))}
                    className="rounded-full bg-card/90 p-1.5 shadow-soft"
                    aria-label="ç§»é™¤ç…§ç‰‡"
                  >
                    <X className="size-4" strokeWidth={1.8} />
                  </button>
                </div>
                <div className="absolute right-3 bottom-14 left-3">
                  <PhotoCropPositionControl
                    id="memory-photo-position"
                    value={draft.photoPosition}
                    onChange={(photoPosition) => setDraft((d) => ({ ...d, photoPosition }))}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 text-muted-foreground"
              >
                <ImagePlus className="size-6" strokeWidth={1.4} />
                <span className="text-sm">æ”¾ä¸€å¼µé‚£å¤©çš„ç…§ç‰‡ï¼ˆå¯ç•¥éï¼‰</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-title">
              æ¨™é¡Œ<span className="ml-1 text-primary">*</span>
            </Label>
            <Input
              id="memory-title"
              value={draft.title}
              placeholder="ä¾‹å¦‚ï¼šæ¼”å”±æœƒ Day 1"
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-date">æ—¥æœŸ</Label>
            <Input
              id="memory-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-note">å¿ƒå¾—</Label>
            <Textarea
              id="memory-note"
              rows={4}
              value={draft.note}
              placeholder="ä»Šå¤©çœŸçš„è¦‹åˆ°ä»–äº†â‹¯"
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              className="rounded-xl bg-surface/50"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-border/70 py-3 text-sm transition-transform duration-3=öï~m¢G§²ÚîÆ­yÖW‡B×6ÒföçBÖÖVF—VÒFW‡B×&–Ö'’Öf÷&Vw&÷VæB6†F÷r×6ögB ¢à¢Y¹îX‹h‰y¨NXnX8ğ¢ÂôÆ–æ³à¢ÂöF—cà¢Âô6†VÆÃà¢“°¢Ğ ¢7–æ2gVæ7F–öâ†æFÆU6fR†G&gC¢–FöÄG&gB’°¢–b‚–FöÂ’&WGW&ã°¢v—BWFFT–FöÂ†–FöÂæ–BÂG&gB“°¢6WDVF—F–ær†fÇ6R“°¢Ğ ¢7–æ2gVæ7F–öâ†æFÆTFVÆWFR‚’°¢–b‚–FöÂ’&WGW&ã°¢v—B&VÖ÷fU&VÖ–æFW'4f÷$–FöÂ†–FöÄ–B“°¢v—B&VÖ÷fT–FöÂ†–FöÂæ–B“°¢6WD6öæf—&Ö–ær†fÇ6R“°¢6WDVF—F–ær†fÇ6R“°¢æf–vFR‡²Fó¢"ö–FöÇ2"Ò“°¢Ğ ¢6öç7B²–C¢ö–BÂââæG&gBÒÒ–FöÃ°¢6öç7BF’Ò&–Ö'”F’†–FöÂ“°¢6öç7B6–æ6RÒF—56–æ6R†–FöÂç6–æ6TFFR“°¢6öç7BFV'WBÒæW‡Dææ—fW'6'’†–FöÂæFV'WDFFR“°¢6öç7B&—'F†F•&VÖ–æFW"Ò&VÖ–æFW$f÷"‡²G—S¢$$•%D„D’"Â–FöÄ–BÒ“°¢6öç7BFV'WE&VÖ–æFW"Ò&VÖ–æFW$f÷"‡²G—S¢$ää•dU%4%’"Â–FöÄ–BÒ“° ¢&WGW&â€¢Ä6†VÆÃà¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâ#à¢ÄÆ–æ°¢FóÒ"ö–FöÇ2 ¢6Æ74æÖSÒ&–æÆ–æRÖfÆW‚—FV×2Ö6VçFW"vÓFW‡B×6ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB ¢à¢Ä6†Wg&öäÆVgB6Æ74æÖSÒ'6—¦RÓB"7G&ö¶Uv–GFƒ×³ã‡Òóà¢h‰y¨NXnX8ğ¢ÂôÆ–æ³à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WDVF—F–ær‡G'VR—Ğ¢6Æ74æÖSÒ&–æÆ–æRÖfÆW‚—FV×2Ö6VçFW"vÓãR&÷VæFVBÖgVÆÂ&÷&FW"&÷&FW"Ö&÷&FW"ós‚Ó2ãR’ÓãRFW‡B×6ÒG&ç6—F–öâ×G&ç6f÷&ÒGW&F–öâÓ37F—fS§66ÆRÓ“R ¢à¢ÅVæ6–Â6Æ74æÖSÒ'6—¦RÓ2ãR"7G&ö¶Uv–GFƒ×³ã‡Òóà¢{z‹Êğ¢Âö'WGFöãà¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ&÷fW&fÆ÷rÖ†–FFVâ&÷VæFVBÓ7†Â&÷&FW"&÷&FW"Ö&÷&FW"óc&rÖ6&B6†F÷r×6ögB#à¢ÆF—b6Æ74æÖSÒ&7V7BÕ³BóUÒrÖgVÆÂ&r×7W&f6R#à¢¶–FöÂç†÷Fòò€¢Å7F÷&VD–ÖvP¢7&3×¶–FöÂç†÷F÷Ğ¢ÇC×¶G¶–FöÂææÖWÒy¨NxZ~x˜vĞ¢6Æ74æÖSÒ'6—¦RÖgVÆÂö&¦V7BÖ6÷fW" ¢7G–ÆS×·²ö&¦V7E÷6—F–öã¢SRG¶–FöÂç†÷Fõ÷6—F–öâóòSÒV×Ğ¢óà¢’¢€¢ÆF—b6Æ74æÖSÒ&fÆW‚6—¦RÖgVÆÂfÆW‚Ö6öÂ—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"vÓ"FW‡BÖ×WFVBÖf÷&Vw&÷VæB#à¢Ä–ÖvT–6öâ6Æ74æÖSÒ'6—¦RÓr"7G&ö¶Uv–GFƒ×³ã7Òóà¢Ç7â6Æ74æÖSÒ'FW‡B×‡2#îiKîKˆ[Ë^KÚiÈYiÎjÚy¨NxZ~x˜sÂ÷7ãà¢ÂöF—cà¢—Ğ¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ'‚Ób’ÓbFW‡BÖ6VçFW"#à¢Æƒ6Æ74æÖSÒ'FW‡BÓ'†ÂföçB×6VÖ–&öÆB#ç¶–FöÂææÖWÓÂöƒà¢¶–FöÂæw&÷WæÖRò€¢Ç6Æ74æÖSÒ&×BÓãRFW‡B×6ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB#ç¶–FöÂæw&÷WæÖWÓÂ÷à¢’¢çVÆÇĞ¢ÂöF—cà¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ&×BÓRw&–Bw&–BÖ6öÇ2Ó"vÓB#à¢Å6ögD6&B6Æ74æÖSÒ'‚ÓB’ÓRFW‡BÖ6VçFW"#à¢Ç6Æ74æÖSÒ'FW‡B×‡2FW‡BÖ×WFVBÖf÷&Vw&÷VæB#ç¶F’òF’çF—FÆR¢$BÔF’'ÓÂ÷à¢Ç6Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçB×6VÖ–&öÆBFW‡B×&–Ö'’#à¢¶F’òF’æFF”Æ&VÂ¢.(	B'Ğ¢Â÷à¢Ç6Æ74æÖSÒ&×BÓFW‡B×‡2FW‡BÖ×WFVBÖf÷&Vw&÷VæB#à¢¶F’òF’æ‡VÖäÆ&VÂ¢.ŠŠŞZé®KˆX¾˜xŞŠhiz^ZÙ'Ğ¢Â÷à¢Âõ6ögD6&Cà¢Å6ögD6&B6Æ74æÖSÒ'‚ÓB’ÓRFW‡BÖ6VçFW"#à¢Ç6Æ74æÖSÒ'FW‡B×‡2FW‡BÖ×WFVBÖf÷&Vw&÷VæB#î™š®KËNy¨Niz^ZÙÂ÷à¢Ç6Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçB×6VÖ–&öÆBFW‡B×&–Ö'’#à¢·6–æ6Rò6–æ6RæFF”Æ&VÂ¢.(	B'Ğ¢Â÷à¢Ç6Æ74æÖSÒ&×BÓFW‡B×‡2FW‡BÖ×WFVBÖf÷&Vw&÷VæB#à¢·6–æ6Rò6–æ6Ræ‡VÖäÆ&VÂ¢.ŠŠŞZé®YiÎjÚK¹ny¨Niz^iÉò'Ğ¢Â÷à¢Âõ6ögD6&Cà¢ÂöF—cà ¢Å6ögD6&B6Æ74æÖSÒ&×BÓR‚ÓR’Ó"#à¢Å&÷rÆ&VÃÒ.yIşizR"fÇVS×¶–FöÂæ&—'F†F—Òóà¢Å&÷p¢Æ&VÃÒ.X{®˜>iz^iÉò ¢fÇVS×°¢–FöÂæFV'WDFFP¢òG¶–FöÂæFV'WDFFWŞûÈ‚G¶FV'WCòæF—5VçF–ÂÓÓÒò.K¸®ZJiŠşX{®˜>{H[û^izR"¢X{®˜>{H[û^izRG¶FV'WCòæFF”Æ&VÇÖŞûÈ– ¢¢" ¢Ğ¢óà¢Å&÷rÆ&VÃÒ.{({[.YŞz‹"fÇVS×¶–FöÂæfäæÖWÒóà¢Å&÷rÆ&VÃÒ.h‰YiÎjÚK¹ny¨Niz^iÉò"fÇVS×¶–FöÂç6–æ6TFFWÒóà¢Âõ6ögD6&Cà ¢¶–FöÂæ&—'F†F’ÇÂ–FöÂæFV'WDFFRò€¢Å6ögD6&B6Æ74æÖSÒ&×BÓRF—f–FR×’F—f–FRÖ&÷&FW"óc#à¢¶–FöÂæ&—'F†F’ò€¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WE&VÖ–æFW$¶–æB‚$$•%D„D’"—Ğ¢6Æ74æÖSÒ&fÆW‚rÖgVÆÂ—FV×2Ö6VçFW"vÓ2‚ÓR’ÓBFW‡BÖÆVgBG&ç6—F–öâÖ6öÆ÷'27F—fS¦&r×7W&f6Rós ¢à¢Ä&VÆÂ6Æ74æÖSÒ'6—¦RÕ³‡…ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB"7G&ö¶Uv–GFƒ×³ãgÒóà¢Ç7â6Æ74æÖSÒ&fÆW‚ÓFW‡B×6Ò#îyIşiz^hù˜i#Â÷7ãà¢Ç7â6Æ74æÖSÒ'FW‡B×6ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB#à¢¶&—'F†F•&VÖ–æFW"òf÷&ÖDF—4&Vf÷&R†&—'F†F•&VÖ–æFW"æF—4&Vf÷&R’¢.KˆŞhù˜i"'Ğ¢Â÷7ãà¢Âö'WGFöãà¢’¢çVÆÇĞ¢¶–FöÂæFV'WDFFRò€¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WE&VÖ–æFW$¶–æB‚$ää•dU%4%’"—Ğ¢6Æ74æÖSÒ&fÆW‚rÖgVÆÂ—FV×2Ö6VçFW"vÓ2‚ÓR’ÓBFW‡BÖÆVgBG&ç6—F–öâÖ6öÆ÷'27F—fS¦&r×7W&f6Rós ¢à¢Ä&VÆÂ6Æ74æÖSÒ'6—¦RÕ³‡…ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB"7G&ö¶Uv–GFƒ×³ãgÒóà¢Ç7â6Æ74æÖSÒ&fÆW‚ÓFW‡B×6Ò#îX{®˜>{H[û^iz^hù˜i#Â÷7ãà¢Ç7â6Æ74æÖSÒ'FW‡B×6ÒFW‡BÖ×WFVBÖf÷&Vw&÷VæB#à¢¶FV'WE&VÖ–æFW"òf÷&ÖDF—4&Vf÷&R†FV'WE&VÖ–æFW"æF—4&Vf÷&R’¢.KˆŞhù˜i"'Ğ¢Â÷7ãà¢Âö'WGFöãà¢’¢çVÆÇĞ¢Âõ6ögD6&Cà¢’¢çVÆÇĞ ¢Å&VÖ–æFW%6†VW@¢÷Vã×·&VÖ–æFW$¶–æBÓÒçVÆÇĞ¢öä÷Vä6†ævS×²†ò’Óâ°¢–b‚ò’6WE&VÖ–æFW$¶–æB†çVÆÂ“°¢×Ğ¢WfVçDÆ&VÃ×¶–FöÂææÖWĞ¢WfVçEF—FÆS×·&VÖ–æFW$¶–æBÓÓÒ$ää•dU%4%’"ò.X{®˜>{H[û^izR"¢.yIşizR'Ğ¢WfVçDFFS×²‡&VÖ–æFW$¶–æBÓÓÒ$ää•dU%4%’"ò–FöÂæFV'WDFFR¢–FöÂæ&—'F†F’’ÇÂ"'Ğ¢–æ—F–ÄF—4&Vf÷&S×°¢&VÖ–æFW$¶–æBÓÓÒ$ää•dU%4%’ ¢ò†FV'WE&VÖ–æFW#òæF—4&Vf÷&RóòDTdTÅEôD•5ô$Tdõ$R¢¢†&—'F†F•&VÖ–æFW#òæF—4&Vf÷&RóòDTdTÅEôD•5ô$Tdõ$R¢Ğ¢öå6fS×²†F—4&Vf÷&R’Óâ°¢–b‚&VÖ–æFW$¶–æB’&WGW&ã°¢fö–B6WE&VÖ–æFW$f÷"‡²G—S¢&VÖ–æFW$¶–æBÂ–FöÄ–BÒÂF—4&Vf÷&R“°¢6öç7BFFRÒ&VÖ–æFW$¶–æBÓÓÒ$ää•dU%4%’"ò–FöÂæFV'WDFFR¢–FöÂæ&—'F†F“°¢fö–B66†VGVÆT–FöÄææ—fW'6'”æ÷F–f–6F–öâ‡°¢–FöÄ–BÀ¢–FöÄæÖS¢–FöÂææÖRÀ¢G—S¢&VÖ–æFW$¶–æB2$$•%D„D’"Â$ää•dU%4%’"À¢FFRÀ¢F—4&Vf÷&RÀ¢Ò“°¢6WE&VÖ–æFW$¶–æB†çVÆÂ“°¢×Ğ¢óà ¢Ä–FöÄf÷&Õ6†VW@¢÷Vã×¶VF—F–æwĞ¢öä÷Vä6†ævS×·6WDVF—F–æwĞ¢–æ—F–Ã×¶G&gGĞ¢F—FÆSÒ.{z‹ÊşXnX8ò ¢7V&Ö—DÆ&VÃÒ.XK.ZÙ‚ ¢öå7V&Ö—C×¶†æFÆU6fWĞ¢fö÷FW#×°¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WD6öæf—&Ö–ær‡G'VR—Ğ¢6Æ74æÖSÒ'rÖgVÆÂ&÷VæFVBÖgVÆÂ’Ó2FW‡B×6ÒFW‡BÖFW7G'V7F—fRG&ç6—F–öâ×G&ç6f÷&ÒGW&F–öâÓ37F—fS§66ÆRÓ“R ¢à¢XŠ®™šNXnX8ğ¢Âö'WGFöãà¢Ğ¢óà ¢ÄÆW'DF–Æör÷Vã×¶6öæf—&Ö–æwÒöä÷Vä6†ævS×·6WD6öæf—&Ö–æwÓà¢ÄÆW'DF–Æöt6öçFVçB6Æ74æÖSÒ&Ö‚×rÕ³#&VÕÒ&÷VæFVBÓ'†Â#à¢ÄÆW'DF–Æöt†VFW#à¢ÄÆW'DF–ÆöuF—FÆSîz+®Zé®Šhz{¾™šN˜	KØŞXnX8şYxîûÉóÂôÆW'DF–ÆöuF—FÆSà¢ÄÆW'DF–ÆötFW67&—F–öãîz{¾™šN[èÎyºîX˜Şy¨NiÊÎYË‹8~ii[~iÈ>khZK8#ÂôÆW'DF–ÆötFW67&—F–öãà¢ÂôÆW'DF–Æöt†VFW#à¢ÄÆW'DF–Æötfö÷FW#à¢ÄÆW'DF–Æöt6æ6VÃîXùnkhƒÂôÆW'DF–Æöt6æ6VÃà¢ÄÆW'DF–Æöt7F–öâöä6Æ–6³×¶†æFÆTFVÆWFWÓîz+®Š¨Şz{¾™šCÂôÆW'DF–Æöt7F–öãà¢ÂôÆW'DF–Æötfö÷FW#à¢ÂôÆW'DF–Æöt6öçFVçCà¢ÂôÆW'DF–Æösà¢Âô6†VÆÃà¢“°§Ğ