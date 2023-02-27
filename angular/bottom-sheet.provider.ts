import { ComponentPortal, TemplatePortal } from "@angular/cdk/portal";
import {
  ComponentFactoryResolver, ComponentRef,
  Injectable,
  Injector,
  TemplateRef,
  Type,
  ViewContainerRef,
} from "@angular/core";
import { BottomSheetComponent } from "./bottom-sheet.component";
import { BottomSheetContext } from "./BottomSheetContext";

export type BottomSheetContent<TProps> =
  | TemplateRef<{ $implicit: BottomSheetContext<Partial<TProps>> }>
  | Type<TProps>;

export interface BottomSheetOptions<TProps> {
  height?: string | number;
  maxHeight?: string | number;
  title?: string;
  stops: number[];
  vcRef?: ViewContainerRef;
  props?: Partial<TProps>;
  customClass?: string;
}

@Injectable()
export class BottomSheetProvider {
  rootVcRef?: ViewContainerRef;

  constructor(
    private injector: Injector,
    private resolver: ComponentFactoryResolver
  ) {}

  async show<TProps>(
    templateRef: BottomSheetContent<TProps>,
    options: BottomSheetOptions<TProps>
  ): Promise<any> {
    const sheetWrapperInstanceRef = this.create<TProps>(templateRef, options);

    return new Promise((resolve) => {
      sheetWrapperInstanceRef.instance.onInit = () => {
        sheetWrapperInstanceRef.instance.open();
      };
      sheetWrapperInstanceRef.instance.onClose = (value) => {
        resolve(value);
        sheetWrapperInstanceRef.destroy();
      };
    });
  }

  showRef<TProps>(
      templateRef: BottomSheetContent<TProps>,
      options: BottomSheetOptions<TProps>
  ): ComponentRef<BottomSheetComponent<unknown>> {
    const sheetWrapperInstanceRef = this.create<TProps>(templateRef, options);

    sheetWrapperInstanceRef.instance.onInit = () => {
      sheetWrapperInstanceRef.instance.open();
    };

    sheetWrapperInstanceRef.instance.onClose = (value) => {
      sheetWrapperInstanceRef.destroy();
    };

    return sheetWrapperInstanceRef;
  }

  create<TProps>(
    templateRef: BottomSheetContent<TProps>,
    {
      height,
      maxHeight = ``,
      title,
      stops,
      vcRef = this.rootVcRef,
      props,
      customClass
    }: BottomSheetOptions<TProps>
  ) {
    if (vcRef == null) {
      throw new Error(
        "vcRef is null, either set the rootVcRef or pass one with the show method"
      );
    }

    let sheetWrapperInstance: BottomSheetComponent<unknown>;

    const context = new BottomSheetContext(
      (value) => sheetWrapperInstance.close(value),
      (value) => sheetWrapperInstance.setValue(value),
      props
    );

    const injector = Injector.create({
      providers: [{ provide: BottomSheetContext, useValue: context }],
      parent: this.injector,
    });

    const sheetWrapperFactory =
      this.resolver.resolveComponentFactory(BottomSheetComponent);

    const sheetWrapperInstanceRef = vcRef.createComponent(
      sheetWrapperFactory,
      undefined,
      injector
    );

    const sheetContent = this.resolveContent(
      templateRef,
      context,
      vcRef,
      injector
    );

    sheetWrapperInstance = sheetWrapperInstanceRef.instance;
    sheetWrapperInstance.title = title;
    sheetWrapperInstance.height =
      typeof height === "number" ? `${height}px` : height;
    sheetWrapperInstance.maxHeight =
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
    sheetWrapperInstance.stops = stops;
    sheetWrapperInstance.contentPortal = sheetContent;
    sheetWrapperInstance.customClass = customClass;

    return sheetWrapperInstanceRef;
  }

  private resolveContent<TProps>(
    content: BottomSheetContent<TProps>,
    context: BottomSheetContext<TProps>,
    viewContainerRef: ViewContainerRef,
    injector: Injector
  ) {
    if (content instanceof TemplateRef) {
      return new TemplatePortal(content, viewContainerRef, {
        $implicit: context,
      });
    }

    return new ComponentPortal(content, undefined, injector, this.resolver);
  }
}
